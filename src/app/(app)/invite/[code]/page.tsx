import Link from "next/link";
import { Suspense } from "react";
import { Card, Skeleton } from "@/components/ui";
import { requireViewer } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { JoinForm } from "./join-form";

export const metadata = { title: "Invite" };

type Params = Promise<{ code: string }>;

export default function InvitePage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<Skeleton className="h-48" />}>
      <Invite params={params} />
    </Suspense>
  );
}

async function Invite({ params }: { params: Params }) {
  const { code } = await params;
  const viewer = await requireViewer();
  const supabase = await createClient();
  const { data } = await supabase.rpc("invite_preview", { invite_code: code });
  const invite = data?.[0];

  return (
    <Card className="mx-auto max-w-md text-center">
      {!invite || !invite.valid ? (
        <>
          <h1 className="text-2xl font-bold">Invite not valid</h1>
          <p className="mt-2 text-muted">This invite link has expired or been revoked. Ask for a new one.</p>
          <Link href="/groups" className="mt-4 inline-block text-accent">Go to groups</Link>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">You&apos;re invited to join</p>
          <h1 className="mt-1 text-2xl font-bold">{invite.group_name}</h1>
          <div className="mt-6">
            <JoinForm code={code} readOnly={viewer.profile.is_demo} />
          </div>
        </>
      )}
    </Card>
  );
}
