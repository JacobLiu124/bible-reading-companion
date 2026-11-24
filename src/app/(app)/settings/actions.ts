"use server";

import { redirect } from "next/navigation";
import { type ActionResult, runAction } from "@/lib/actions";
import { friendlyError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { firstIssue, profileSchema } from "@/lib/validation";

export async function updateProfileAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { displayName, denomination, timezone, weeklyGoal } = parsed.data;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return { error: friendlyError({ message: "forbidden" }) };

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, denomination: denomination ?? null, timezone })
    .eq("id", uid);
  if (error) {
    return { error: error.code === "23514" ? "That timezone isn't recognised." : friendlyError(error) };
  }
  return runAction((sb) => sb.rpc("set_weekly_goal", { goal: weeklyGoal }));
}

export async function deleteAccountAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return { error: friendlyError({ message: "forbidden" }) };
  const { data: profile } = await supabase.from("profiles").select("username").eq("id", uid).single();
  if (
    String(form.get("confirm") ?? "")
      .trim()
      .toLowerCase() !== profile?.username
  ) {
    return { error: "Type your username exactly to confirm." };
  }
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { error: friendlyError(error) };
  await supabase.auth.signOut();
  redirect("/");
}
