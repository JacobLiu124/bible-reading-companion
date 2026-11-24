import "server-only";
import { refresh } from "next/cache";
import { friendlyError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok?: boolean; error?: string } | undefined;
type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Runs a database call from a Server Action, maps errors to friendly copy and refreshes the page. */
export async function runAction(
  fn: (supabase: Supabase) => PromiseLike<{ error: unknown }>,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await fn(supabase);
  if (error) return { error: friendlyError(error) };
  refresh();
  return { ok: true };
}
