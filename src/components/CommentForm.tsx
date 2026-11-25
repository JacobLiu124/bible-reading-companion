"use client";

import { useActionState, useEffect, useRef } from "react";
import { addCommentAction } from "@/app/(app)/actions";
import { Button, FormError, Textarea } from "@/components/ui";

export function CommentForm({
  postId,
  rules,
  verse,
  disabledReason,
}: {
  postId: string;
  rules: string;
  verse?: { text: string; reference: string };
  disabledReason?: string;
}) {
  const [state, action, pending] = useActionState(addCommentAction, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="postId" value={postId} />
      {(rules || verse) && (
        <div className="bg-surface-2 text-muted space-y-2 rounded-xl px-3 py-2.5 text-xs">
          {rules && (
            <p>
              <span className="text-ink font-semibold">Rules: </span>
              {rules}
            </p>
          )}
          {verse && (
            <blockquote>
              <p className="font-scripture text-ink text-sm leading-relaxed">&ldquo;{verse.text}&rdquo;</p>
              <p className="mt-0.5">{verse.reference}</p>
            </blockquote>
          )}
        </div>
      )}
      <Textarea
        name="body"
        maxLength={1000}
        placeholder={disabledReason ?? "Add a reply…"}
        disabled={Boolean(disabledReason)}
        required
      />
      <FormError message={state?.error} />
      <Button disabled={pending || Boolean(disabledReason)}>{pending ? "Posting…" : "Reply"}</Button>
    </form>
  );
}
