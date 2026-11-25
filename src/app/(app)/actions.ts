"use server";

import { type ActionResult, runAction } from "@/lib/actions";
import { commentSchema, firstIssue, generalPostSchema, readingPostSchema } from "@/lib/validation";

// ---------- reading ----------
export async function checkInAction(): Promise<ActionResult> {
  return runAction((sb) => sb.rpc("check_in"));
}

export async function undoCheckInAction(): Promise<ActionResult> {
  return runAction((sb) => sb.rpc("undo_check_in"));
}

export async function createReadingPostAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  const parsed = readingPostSchema.safeParse({
    body: form.get("body") ?? undefined,
    verseRef: form.get("verseRef") ?? undefined,
    verseText: form.get("verseText") ?? undefined,
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  // One destination per share: "global" or a group id.
  const destination = String(form.get("destination") ?? "global");
  const toGlobal = destination === "global";
  const groupIds = toGlobal ? [] : [destination];
  const { body, verseRef, verseText } = parsed.data;
  return runAction((sb) =>
    sb.rpc("create_reading_post", {
      group_ids: groupIds,
      to_global: toGlobal,
      body: body ?? "",
      verse_ref: verseRef ?? "",
      verse_text: verseText ?? "",
    }),
  );
}

export async function createGeneralPostAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  const parsed = generalPostSchema.safeParse({
    title: form.get("title") ?? undefined,
    body: form.get("body") ?? "",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const groupId = String(form.get("groupId") ?? "");
  return runAction((sb) =>
    sb.rpc("create_general_post", {
      group_id: groupId,
      title: parsed.data.title ?? "",
      body: parsed.data.body,
    }),
  );
}

// ---------- posts ----------
export async function toggleReactionAction(postId: string): Promise<ActionResult> {
  return runAction((sb) => sb.rpc("toggle_reaction", { post_id: postId }));
}

export async function editPostAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  const id = String(form.get("id"));
  const kind = String(form.get("kind"));
  if (kind === "general") {
    const parsed = generalPostSchema.safeParse({
      title: form.get("title") ?? undefined,
      body: form.get("body") ?? "",
    });
    if (!parsed.success) return { error: firstIssue(parsed.error) };
    return runAction((sb) =>
      sb.rpc("edit_post", {
        id,
        title: parsed.data.title ?? "",
        body: parsed.data.body,
        verse_ref: "",
        verse_text: "",
      }),
    );
  }
  const parsed = readingPostSchema.safeParse({
    body: form.get("body") ?? undefined,
    verseRef: form.get("verseRef") ?? undefined,
    verseText: form.get("verseText") ?? undefined,
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  return runAction((sb) =>
    sb.rpc("edit_post", {
      id,
      title: "",
      body: parsed.data.body ?? "",
      verse_ref: parsed.data.verseRef ?? "",
      verse_text: parsed.data.verseText ?? "",
    }),
  );
}

export async function deletePostAction(id: string): Promise<ActionResult> {
  return runAction((sb) => sb.rpc("delete_post", { id }));
}

// ---------- comments ----------
export async function addCommentAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  const parsed = commentSchema.safeParse({ body: form.get("body") ?? "" });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  return runAction((sb) =>
    sb.rpc("add_comment", { post_id: String(form.get("postId")), body: parsed.data.body }),
  );
}

export async function editCommentAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  const parsed = commentSchema.safeParse({ body: form.get("body") ?? "" });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  return runAction((sb) => sb.rpc("edit_comment", { id: String(form.get("id")), body: parsed.data.body }));
}

export async function deleteCommentAction(id: string): Promise<ActionResult> {
  return runAction((sb) => sb.rpc("delete_comment", { id }));
}

// ---------- safety ----------
export async function reportAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  const reason = String(form.get("reason") ?? "");
  if (!["spam", "harassment", "inappropriate", "other"].includes(reason)) {
    return { error: "Choose a reason." };
  }
  const note = String(form.get("note") ?? "").slice(0, 500);
  const postId = form.get("postId") ? String(form.get("postId")) : null;
  const commentId = form.get("commentId") ? String(form.get("commentId")) : null;
  return runAction((sb) =>
    sb.rpc("report_content", {
      post_id: postId as string,
      comment_id: commentId as string,
      reason,
      note,
    }),
  );
}

export async function blockUserAction(userId: string): Promise<ActionResult> {
  return runAction((sb) => sb.rpc("block_user", { uid: userId }));
}

export async function unblockUserAction(userId: string): Promise<ActionResult> {
  return runAction((sb) => sb.rpc("unblock_user", { uid: userId }));
}

export async function acknowledgeNoticeAction(id: string): Promise<ActionResult> {
  return runAction((sb) => sb.rpc("acknowledge_notice", { id }));
}
