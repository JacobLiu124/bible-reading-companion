import { Suspense } from "react";
import { ActionButton } from "@/components/ActionButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button, Card, PageTitle, Skeleton } from "@/components/ui";
import { requireViewer } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../../(auth)/actions";
import { unblockUserAction } from "../actions";
import { DeleteAccountForm, ProfileForm } from "./forms";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageTitle>Settings</PageTitle>
      <Card>
        <h2 className="mb-3 text-lg font-bold">Appearance</h2>
        <ThemeToggle />
      </Card>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <AccountSettings />
      </Suspense>
    </div>
  );
}

async function AccountSettings() {
  const viewer = await requireViewer();
  const { profile } = viewer;
  const supabase = await createClient();
  const { data: blocks } = await supabase
    .from("blocks")
    .select("blocked_id, profiles!blocks_blocked_id_fkey(username, display_name)")
    .eq("blocker_id", viewer.id);
  const readOnly = profile.is_demo;

  return (
    <>
      {readOnly && (
        <p className="rounded-2xl bg-accent-soft p-4 text-sm">
          You&apos;re using the shared demo account, so settings are read-only.
        </p>
      )}
      <Card>
        <h2 className="mb-1 text-lg font-bold">Profile</h2>
        <p className="mb-4 text-sm text-muted">@{profile.username}</p>
        <ProfileForm
          readOnly={readOnly}
          initial={{
            displayName: profile.display_name, denomination: profile.denomination,
            timezone: profile.timezone, weeklyGoal: profile.weekly_goal,
          }}
        />
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-bold">Blocked people</h2>
        {(blocks ?? []).length === 0 ? (
          <p className="text-sm text-muted">You haven&apos;t blocked anyone.</p>
        ) : (
          <ul className="divide-y divide-line">
            {(blocks ?? []).map((b) => (
              <li key={b.blocked_id} className="flex items-center justify-between py-2.5">
                <span>{b.profiles?.display_name} <span className="text-muted">@{b.profiles?.username}</span></span>
                <ActionButton variant="ghost" action={unblockUserAction.bind(null, b.blocked_id)} disabled={readOnly}>Unblock</ActionButton>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <form action={signOut}>
          <Button variant="secondary">Sign out</Button>
        </form>
      </Card>

      <Card className="border-danger/40">
        <h2 className="mb-1 text-lg font-bold text-danger">Delete account</h2>
        <p className="mb-4 text-sm text-muted">
          Permanently deletes your profile, check-ins, posts and comments. Groups you own are handed to another
          member (or deleted if you&apos;re the only one). This can&apos;t be undone.
        </p>
        <DeleteAccountForm username={profile.username} readOnly={readOnly} />
      </Card>
    </>
  );
}
