"use client";

import { Check } from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";
import { checkInAction, undoCheckInAction } from "@/app/(app)/actions";
import { FormError } from "@/components/ui";

const circle =
  "flex size-28 flex-col items-center justify-center gap-1 rounded-full text-sm font-bold transition-transform";
const UNDO_WINDOW_MS = 10 * 60 * 1000;

/** The big round check-in. After checking in, "Undo" shows for the 10 minutes the database allows. */
export function CheckInButton({
  checkedIn,
  checkedInAt,
  readOnly,
}: {
  checkedIn: boolean;
  checkedInAt: string | null;
  readOnly: boolean;
}) {
  const [state, action, pending] = useActionState(checkInAction, undefined);
  const [undoing, startUndo] = useTransition();
  const [undoError, setUndoError] = useState<string>();
  // Worked out once per mount; the page remounts this component (via `key`) when the check-in changes.
  const [undoUntil] = useState(() =>
    checkedIn && checkedInAt && !readOnly ? Date.parse(checkedInAt) + UNDO_WINDOW_MS : 0,
  );
  const [canUndo, setCanUndo] = useState(() => undoUntil > Date.now());

  useEffect(() => {
    if (!undoUntil) return;
    const t = setTimeout(() => setCanUndo(false), Math.max(undoUntil - Date.now(), 0));
    return () => clearTimeout(t);
  }, [undoUntil]);

  if (checkedIn) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className={`${circle} bg-joy text-joy-ink`} role="status">
          <Check size={30} strokeWidth={2.5} aria-hidden />
          Read today
        </div>
        {canUndo && (
          <button
            type="button"
            disabled={undoing}
            onClick={() => startUndo(async () => setUndoError((await undoCheckInAction())?.error))}
            className="text-muted hover:text-ink min-h-11 px-3 text-sm font-medium underline-offset-4 hover:underline"
          >
            {undoing ? "Undoing…" : "Undo"}
          </button>
        )}
        <FormError message={undoError} />
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col items-center gap-2">
      <button
        className={`${circle} bg-primary text-primary-ink hover:brightness-95 active:scale-95 disabled:opacity-50`}
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
