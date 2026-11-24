"use server";

import { redirect } from "next/navigation";
import { type ActionResult, runAction } from "@/lib/actions";
import { friendlyError } from "@/lib/errors";
import { DEFAULT_GROUP_RULES } from "@/lib/globalRules";
import { createClient } from "@/lib/supabase/server";
import { firstIssue, groupSchema } from "@/lib/validation";

export async function createGroupAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  const parsed = groupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { name, description, rules, visibility, denomination } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_group", {
    name, description, rules: rules || DEFAULT_GROUP_RULES, visibility, denomination: denomination ?? "",
  });
  if (error || !data) return { error: friendlyError(error) };
  redirect(`/groups/${data.slug}`);
}

export async function updateGroupAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  const parsed = groupSchema.safeParse({ ...Object.fromEntries(form), visibility: "public" });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { name, description, rules, denomination } = parsed.data;
  return runAction((sb) =>
    sb.rpc("update_group", {
      gid: String(form.get("groupId")), name, description, rules, denomination: denomination ?? "",
    }),
  );
}

export async function joinGroupAction(groupId: string): Promise<ActionResult> {
  return runAction((sb) => sb.rpc("join_public_group", { gid: groupId }));
}

export async function leaveGroupAction(groupId: string): Promise<ActionResult> {
  return runAction((sb) => sb.rpc("leave_group", { gid: groupId }));
}

export async function createInviteAction(groupId: string): Promise<ActionResult> {
  return runAction((sb) => sb.rpc("create_invite", { gid: groupId, days: 7 }));
}

export async function revokeInviteAction(code: string): Promise<ActionResult> {
  return runAction((sb) => sb.rpc("revoke_invite", { invite_code: code }));
}

export async function setRoleAction(groupId: string, userId: string, role: "admin" | "member"): Promise<ActionResult> {
  return runAction((sb) => sb.rpc("set_member_role", { gid: groupId, uid: userId, role }));
}

export async function transferOwnershipAction(groupId: string, userId: string): Promise<ActionResult> {
  return runAction((sb) => sb.rpc("transfer_ownership", { gid: groupId, new_owner: userId }));
}

export async function unbanAction(groupId: string, userId: string): Promise<ActionResult> {
  return runAction((sb) => sb.rpc("unban_user", { group_id: groupId, uid: userId }));
}

export async function deleteOwnGroupAction(groupId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_group", { gid: groupId, reason: "Deleted by owner" });
  if (error) return { error: friendlyError(error) };
  redirect("/groups");
}

export async function redeemInviteAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_invite", { invite_code: String(form.get("code")) });
  if (error || !data) return { error: friendlyError(error) };
  redirect(`/groups/${data.slug}`);
}
