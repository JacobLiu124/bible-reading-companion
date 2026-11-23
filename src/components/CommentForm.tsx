"use client";

import { useActionState, useEffect, useRef } from "react";
import { addCommentAction } from "@/app/(app)/actions";
import { Button, FormError, Textarea } from "@/components/ui";

export function CommentForm({ postId, rules, disabledReason }: { postId: string; rules: string; disabledReason?: string }) {
  const [state, action, pending] = useActionState(addCommentAction, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="postId" value={postId} />
      {rules && (
        <p className="rounded-xl bg-surface-2 px-3 py-2 text-xs text-muted">
          <span className="font-medium text-ink">Rules: </span>{rules}
        </p>
      )}
      <Textarea name="body" maxLength={1000} placeholder={disabledReason ?? "Add a comment…"} disabled={Boolean(disabledReason)} required />
      <FormError message={state?.error} />
      <Button disabled={pending || Boolean(disabledReason)}>{pending ? "Posting…" : "Comment"}</Button>
    </form>
  );
}
