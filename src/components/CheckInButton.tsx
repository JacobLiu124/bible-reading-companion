"use client";

import { useActionState } from "react";
import { checkInAction } from "@/app/(app)/actions";
import { Button, FormError } from "@/components/ui";

export function CheckInButton({ checkedIn, readOnly }: { checkedIn: boolean; readOnly: boolean }) {
  const [state, action, pending] = useActionState(checkInAction, undefined);
  if (checkedIn) {
    return (
      <p className="inline-flex items-center gap-2 rounded-full bg-ok/10 px-4 py-2 text-sm font-medium text-ok">
        ✓ Read today
      </p>
    );
  }
  return (
    <form action={action} className="space-y-2">
      <Button className="px-6 py-3 text-base" disabled={pending || readOnly} title={readOnly ? "Demo is read-only" : undefined}>
        {pending ? "Checking in…" : "I read it"}
      </Button>
      <FormError message={state?.error} />
    </form>
  );
}
