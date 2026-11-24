"use server";

import { type ActionResult, runAction } from "@/lib/actions";

const gid = (v: FormDataEntryValue | null) => (v ? String(v) : null);

export async function removePostAction(id: string, reason = ""): Promise<ActionResult> {
  return runAction((sb) => sb.rpc("remove_post", { id, reason }));
}

export async function removeCommentAction(id: string, reason = ""): Promise<ActionResult> {
  return runAction((sb) => sb.rpc("remove_comment", { id, reason }));
}

/** form: groupId (empty = global), userId, action (warn|mute1|mute7|ban|unban), message */
export async function moderateUserAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  const groupId = gid(form.get("groupId")) as string; // null = global thread
  const uid = String(form.get("userId"));
  const message = String(form.get("message") ?? "").trim();
  switch (form.get("action")) {
    case "warn":
      if (!message) return { error: "Write a short message for the warning." };
      return runAction((sb) => sb.rpc("warn_user", { group_id: groupId, uid, message }));
    case "mute1":
    case "mute7":
      return runAction((sb) =>
        sb.rpc("mute_user", { group_id: groupId, uid, days: form.get("action") === "mute1" ? 1 : 7 }),
      );
    case "ban":
      return runAction((sb) => sb.rpc("ban_user", { group_id: groupId, uid, reason: message }));
    case "unban":
      return runAction((sb) => sb.rpc("unban_user", { group_id: groupId, uid }));
    default:
      return { error: "Choose an action." };
  }
}

export async function resolveReportAction(
  id: string,
  status: "resolved" | "dismissed",
): Promise<ActionResult> {
  return runAction((sb) => sb.rpc("resolve_report", { id, status }));
}

export async function deleteGroupAction(groupId: string, reason: string): Promise<ActionResult> {
  return runAction((sb) => sb.rpc("delete_group", { gid: groupId, reason }));
}
