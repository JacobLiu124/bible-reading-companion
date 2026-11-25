"use client";

import { HandHeart } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toggleReactionAction } from "@/app/(app)/actions";

export function ReactionButton({
  postId,
  count,
  reacted,
  disabled,
}: {
  postId: string;
  count: number;
  reacted: boolean;
  disabled?: boolean;
}) {
  const [state, setState] = useOptimistic({ count, reacted });
  const [, start] = useTransition();
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={state.reacted}
      aria-label={`${state.reacted ? "Remove your prayer" : "Pray for this"}, ${state.count} ${state.count === 1 ? "prayer" : "prayers"}`}
      onClick={() =>
        start(async () => {
          setState({ reacted: !state.reacted, count: state.count + (state.reacted ? -1 : 1) });
          await toggleReactionAction(postId);
        })
      }
      className={`relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium transition-colors after:absolute after:inset-x-0 after:-inset-y-2 after:content-[''] disabled:opacity-50 ${
        state.reacted ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-ink"
      }`}
    >
      <HandHeart size={16} aria-hidden />
      Pray
      {state.count > 0 && <span className="tabular-nums">{state.count}</span>}
    </button>
  );
}
