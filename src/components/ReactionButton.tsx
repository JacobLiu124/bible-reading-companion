"use client";

import { HandHeart } from "lucide-react";
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
      aria-label={state.reacted ? "Remove your prayer" : "Pray for this"}
      onClick={() =>
        start(async () => {
          setState({ reacted: !state.reacted, count: state.count + (state.reacted ? -1 : 1) });
          await toggleReactionAction(postId);
        })
      }
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium transition-colors disabled:opacity-50 ${
        state.reacted ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-ink"
      }`}
    >
      <HandHeart size={16} aria-hidden />
      {state.count > 0 ? state.count : "Pray"}
    </button>
  );
}
