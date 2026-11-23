import Link from "next/link";
import { ContentMenu } from "@/components/ContentMenu";
import { ReactionButton } from "@/components/ReactionButton";
import { Badge } from "@/components/ui";
import { formatTime } from "@/lib/format";
import type { FeedPost } from "@/lib/types";

export function PostCard({
  post, viewerId, timeZone, readOnly, showGroup = false, linkToPost = true,
}: {
  post: FeedPost;
  viewerId: string;
  timeZone: string;
  readOnly: boolean;
  showGroup?: boolean;
  linkToPost?: boolean;
}) {
  const removed = Boolean(post.removed);
  const comments = Number(post.comment_count ?? 0);
  return (
    <article className="rounded-2xl border border-line bg-surface p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">
            {post.author_display_name} <span className="font-normal text-muted">@{post.author_username}</span>
          </p>
          <p className="text-xs text-muted">
            {formatTime(post.created_at, timeZone)}
            {post.edited_at && " · edited"}
            {showGroup && (
              <>
                {" · "}
                {post.group_slug ? (
                  <Link className="hover:underline" href={`/groups/${post.group_slug}`}>{post.group_name}</Link>
                ) : (
                  "🌍 Global"
                )}
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {post.kind === "reading" && post.reference && <Badge>📖 {post.reference}</Badge>}
          <ContentMenu
            target={{
              type: "post", id: post.id, authorId: post.author_id, authorName: post.author_display_name,
              groupId: post.group_id, kind: post.kind, title: post.title, body: post.body,
              verseRef: post.verse_ref, verseText: post.verse_text,
            }}
            isAuthor={post.author_id === viewerId}
            canModerate={Boolean(post.can_moderate)}
            readOnly={readOnly}
            removed={removed}
          />
        </div>
      </header>

      {removed && <p className="mt-3 text-sm italic text-muted">Removed by a moderator.</p>}
      {(!removed || post.can_moderate) && (
        <div className={`mt-3 space-y-3 ${removed ? "opacity-60" : ""}`}>
          {post.title && <h3 className="font-serif text-lg font-semibold">{post.title}</h3>}
          {post.verse_text && (
            <blockquote className="border-l-4 border-accent/60 pl-3 font-serif italic">
              &ldquo;{post.verse_text}&rdquo;
              {post.verse_ref && <span className="not-italic text-muted"> — {post.verse_ref}</span>}
            </blockquote>
          )}
          {!post.verse_text && post.verse_ref && <p className="text-sm text-muted">{post.verse_ref}</p>}
          {post.body && <p className="whitespace-pre-wrap leading-relaxed">{post.body}</p>}
        </div>
      )}

      <footer className="mt-4 flex items-center gap-2">
        <ReactionButton
          postId={post.id}
          count={Number(post.reaction_count ?? 0)}
          reacted={Boolean(post.reacted_by_me)}
          disabled={readOnly || removed}
        />
        {linkToPost && (
          <Link href={`/posts/${post.id}`} className="rounded-full px-3 py-1 text-sm text-muted hover:bg-surface-2">
            💬 {comments} {comments === 1 ? "comment" : "comments"}
          </Link>
        )}
      </footer>
    </article>
  );
}
