import { BookOpen, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { ContentMenu } from "@/components/ContentMenu";
import { ReactionButton } from "@/components/ReactionButton";
import { formatTime } from "@/lib/format";
import type { FeedPost } from "@/lib/types";

/** One post in a feed: avatar on the left, words on the right, no box around it. */
export function PostCard({
  post, viewerId, timeZone, readOnly, showGroup = false, showReference = false, linkToPost = true,
}: {
  post: FeedPost;
  viewerId: string;
  timeZone: string;
  readOnly: boolean;
  showGroup?: boolean;
  showReference?: boolean;
  linkToPost?: boolean;
}) {
  const removed = Boolean(post.removed);
  const comments = Number(post.comment_count ?? 0);
  return (
    <article className="flex gap-3 py-4">
      <Avatar name={post.author_display_name} seed={post.author_username} />
      <div className="min-w-0 flex-1">
        <header className="flex items-start justify-between gap-2">
          <p className="min-w-0 text-sm leading-tight">
            <span className="font-bold">{post.author_display_name}</span>{" "}
            <span className="text-muted">@{post.author_username}</span>
            <span className="block text-xs text-muted">
              {formatTime(post.created_at, timeZone)}
              {post.edited_at && ", edited"}
              {showGroup && (
                <>
                  {" in "}
                  {post.group_slug ? (
                    <Link className="font-medium hover:underline" href={`/groups/${post.group_slug}`}>{post.group_name}</Link>
                  ) : (
                    "the global thread"
                  )}
                </>
              )}
            </span>
          </p>
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
        </header>

        {showReference && post.kind === "reading" && post.reference && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
            <BookOpen size={14} aria-hidden /> {post.reference}
          </p>
        )}

        {removed && <p className="mt-2 text-sm italic text-muted">Removed by a moderator.</p>}
        {(!removed || post.can_moderate) && (
          <div className={`mt-2 space-y-2 ${removed ? "opacity-60" : ""}`}>
            {post.title && <h3 className="font-bold">{post.title}</h3>}
            {post.verse_text && (
              <blockquote className="border-l-2 border-accent pl-3">
                <p>&ldquo;{post.verse_text}&rdquo;</p>
                {post.verse_ref && <p className="mt-0.5 text-sm text-muted">{post.verse_ref}</p>}
              </blockquote>
            )}
            {!post.verse_text && post.verse_ref && <p className="text-sm text-muted">{post.verse_ref}</p>}
            {post.body && <p className="whitespace-pre-wrap leading-relaxed">{post.body}</p>}
          </div>
        )}

        <footer className="-ml-2.5 mt-2 flex items-center gap-1">
          <ReactionButton
            postId={post.id}
            count={Number(post.reaction_count ?? 0)}
            reacted={Boolean(post.reacted_by_me)}
            disabled={readOnly || removed}
          />
          {linkToPost && (
            <Link
              href={`/posts/${post.id}`}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink"
            >
              <MessageCircle size={16} aria-hidden />
              {comments > 0 ? `${comments} ${comments === 1 ? "reply" : "replies"}` : "Reply"}
            </Link>
          )}
        </footer>
      </div>
    </article>
  );
}

/** A list of posts separated by hairlines. */
export function PostList({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-line">{children}</div>;
}
