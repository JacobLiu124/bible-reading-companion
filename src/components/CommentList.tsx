import { ContentMenu } from "@/components/ContentMenu";
import { formatTime } from "@/lib/format";
import type { FeedComment } from "@/lib/types";

export function CommentList({
  comments, viewerId, timeZone, readOnly, groupId,
}: { comments: FeedComment[]; viewerId: string; timeZone: string; readOnly: boolean; groupId: string | null }) {
  if (comments.length === 0) return <p className="text-sm text-muted">No comments yet.</p>;
  return (
    <ul className="space-y-3">
      {comments.map((c) => {
        const removed = Boolean(c.removed);
        return (
          <li key={c.id} className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm">
                <span className="font-medium">{c.author_display_name}</span>{" "}
                <span className="text-muted">@{c.author_username} · {formatTime(c.created_at, timeZone)}{c.edited_at && " · edited"}</span>
              </p>
              <ContentMenu
                target={{ type: "comment", id: c.id, authorId: c.author_id, authorName: c.author_display_name, groupId, body: c.body }}
                isAuthor={c.author_id === viewerId}
                canModerate={Boolean(c.can_moderate)}
                readOnly={readOnly}
                removed={removed}
              />
            </div>
            {removed && <p className="mt-1 text-sm italic text-muted">Removed by a moderator.</p>}
            {(!removed || c.can_moderate) && c.body && (
              <p className={`mt-1 whitespace-pre-wrap ${removed ? "opacity-60" : ""}`}>{c.body}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
