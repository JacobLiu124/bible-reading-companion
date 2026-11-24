import { Avatar } from "@/components/Avatar";
import { ContentMenu } from "@/components/ContentMenu";
import { formatTime } from "@/lib/format";
import type { FeedComment } from "@/lib/types";

export function CommentList({
  comments,
  viewerId,
  timeZone,
  readOnly,
  groupId,
}: {
  comments: FeedComment[];
  viewerId: string;
  timeZone: string;
  readOnly: boolean;
  groupId: string | null;
}) {
  if (comments.length === 0)
    return <p className="text-muted text-sm">No replies yet. Start the conversation.</p>;
  return (
    <ul className="divide-line divide-y">
      {comments.map((c) => {
        const removed = Boolean(c.removed);
        return (
          <li key={c.id} className="flex gap-3 py-3">
            <Avatar name={c.author_display_name} seed={c.author_username} size={30} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm leading-tight">
                  <span className="font-bold">{c.author_display_name}</span>{" "}
                  <span className="text-muted">@{c.author_username}</span>
                  <span className="text-muted block text-xs">
                    {formatTime(c.created_at, timeZone)}
                    {c.edited_at && ", edited"}
                  </span>
                </p>
                <ContentMenu
                  target={{
                    type: "comment",
                    id: c.id,
                    authorId: c.author_id,
                    authorName: c.author_display_name,
                    groupId,
                    body: c.body,
                  }}
                  isAuthor={c.author_id === viewerId}
                  canModerate={Boolean(c.can_moderate)}
                  readOnly={readOnly}
                  removed={removed}
                />
              </div>
              {removed && <p className="text-muted mt-1 text-sm italic">Removed by a moderator.</p>}
              {(!removed || c.can_moderate) && c.body && (
                <p className={`mt-1 whitespace-pre-wrap ${removed ? "opacity-60" : ""}`}>{c.body}</p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
