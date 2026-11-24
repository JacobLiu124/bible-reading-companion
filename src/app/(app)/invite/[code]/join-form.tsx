"use client";

import { useActionState } from "react";
import { redeemInviteAction } from "@/app/(app)/groups/actions";
import { Button, FormError } from "@/components/ui";

export function JoinForm({ code, readOnly }: { code: string; readOnly: boolean }) {
  const [state, action, pending] = useActionState(redeemInviteAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="code" value={code} />
      <Button className="w-full" disabled={pending || readOnly}>
        {pending ? "Joining…" : "Join group"}
      </Button>
      <FormError message={state?.error} />
    </form>
  );
}
