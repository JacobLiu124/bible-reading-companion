import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackLink } from "@/components/BackLink";
import { CommentForm } from "@/components/CommentForm";
import { CommentList } from "@/components/CommentList";
import { PostCard } from "@/components/PostCard";
import { Skeleton } from "@/components/ui";
import { GLOBAL_RULES, GLOBAL_RULES_VERSE } from "@/lib/globalRules";
import { requireViewer } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Post" };

type Params = Promise<{ id: string }>;

export default function PostPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Post params={params} />
    </Suspense>
  );
}

async function Post({ params }: { params: Params }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const viewer = await requireViewer();
  const supabase = await createClient();
  const { data: post } = await supabase.from("feed_posts").select("*").eq("id", id).maybeSingle();
  if (!post) notFound();

  const [comments, group, membership] = await Promise.all([
    supabase.from("feed_comments").select("*").eq("post_id", id).order("created_at").limit(500),
    post.group_id
      ? supabase.from("groups").select("rules, slug, name").eq("id", post.group_id).maybeSingle()
      : Promise.resolve({ data: null }),
    post.group_id
      ? supabase
          .from("group_members")
          .select("role")
          .eq("group_id", post.group_id)
          .eq("user_id", viewer.id)
          .eq("banned", false)
          .maybeSingle()
      : Promise.resolve({ data: { role: "member" } }),
  ]);

  const readOnly = viewer.profile.is_demo;
  const disabledReason = readOnly
    ? "The demo is read-only"
    : post.removed
      ? "Comments are closed on removed posts"
      : !membership.data
        ? "Join this group to comment"
        : undefined;

  const back = post.group_id
    ? { href: `/groups/${group.data?.slug}`, label: group.data?.name ?? "Group" }
    : { href: post.reading_date ? `/global/${post.reading_date}` : "/today", label: "Global thread" };

  return (
    <div className="space-y-6">
      <BackLink href={back.href}>{back.label}</BackLink>
      <PostCard
        post={post}
        viewerId={viewer.id}
        timeZone={viewer.profile.timezone}
        readOnly={readOnly || !membership.data}
        linkToPost={false}
        showGroup
      />
      <section className="space-y-4">
        <h2 className="text-lg font-bold">Replies</h2>
        <CommentList
          comments={comments.data ?? []}
          viewerId={viewer.id}
          timeZone={viewer.profile.timezone}
          readOnly={readOnly}
          groupId={post.group_id}
        />
        <CommentForm
          postId={post.id}
          rules={post.group_id ? (group.data?.rules ?? "") : GLOBAL_RULES}
          verse={post.group_id ? undefined : GLOBAL_RULES_VERSE}
          disabledReason={disabledReason}
        />
      </section>
    </div>
  );
}
