"use client";

import { Check } from "lucide-react";
import { useActionState } from "react";
import { checkInAction } from "@/app/(app)/actions";
import { FormError } from "@/components/ui";

const circle = "flex size-28 flex-col items-center justify-center gap-1 rounded-full text-sm font-bold transition-transform";

export function CheckInButton({ checkedIn, readOnly }: { checkedIn: boolean; readOnly: boolean }) {
  const [state, action, pending] = useActionState(checkInAction, undefined);
  if (checkedIn) {
    return (
      <div className={`${circle} bg-joy text-joy-ink`} role="status">
        <Check size={30} strokeWidth={2.5} aria-hidden />
        Read today
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col items-center gap-2">
      <button
        className={`${circle} bg-accent text-accent-ink hover:brightness-110 active:scale-95 disabled:opacity-50`}
        disabled={pending || readOnly}
        title={readOnly ? "The demo is read-only" : undefined}
      >
        <Check size={30} strokeWidth={2.5} aria-hidden />
        {pending ? "Saving…" : "I read it"}
      </button>
      <FormError message={state?.error} />
    </form>
  );
}
