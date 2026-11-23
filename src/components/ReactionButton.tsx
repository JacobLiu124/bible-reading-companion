"use client";

import { useOptimistic, useTransition } from "react";
import { toggleReactionAction } from "@/app/(app)/actions";

export function ReactionButton({
  postId, count, reacted, disabled,
}: { postId: string; count: number; reacted: boolean; disabled?: boolean }) {
  const [state, setState] = useOptimistic({ count, reacted });
  const [, start] = useTransition();
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={state.reacted}
      aria-label={state.reacted ? "Remove prayer reaction" : "React with prayer"}
      onClick={() =>
        start(async () => {
          setState({ reacted: !state.reacted, count: state.count + (state.reacted ? -1 : 1) });
          await toggleReactionAction(postId);
        })
      }
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm transition disabled:opacity-50 ${
        state.reacted ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2"
      }`}
    >
      🙏 {state.count}
    </button>
  );
}
