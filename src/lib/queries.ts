import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer, type Viewer } from "@/lib/viewer";
import type { GroupOption } from "@/lib/types";

/**
 * The viewer, or a redirect that signs out. Signed-out visitors never reach pages
 * (the proxy sends them to /sign-in), so no viewer here means a stale session whose
 * account is gone: clear it rather than bounce between /sign-in and /today.
 */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/auth/sign-out");
  return viewer;
}

/** Groups the viewer is an active (not banned) member of. */
export async function getMyGroups(
  viewerId: string,
): Promise<(GroupOption & { slug: string; role: string })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("group_members")
    .select("role, groups!inner(id, name, slug)")
    .eq("user_id", viewerId)
    .eq("banned", false)
    .order("joined_at");
  return (data ?? []).map((m) => ({ ...m.groups, role: m.role }));
}

/** Whether the viewer moderates anything (owner/admin of a group, or site admin). */
export async function moderatesSomething(viewer: Viewer): Promise<boolean> {
  if (viewer.profile.is_site_admin) return true;
  const supabase = await createClient();
  const { count } = await supabase
    .from("group_members")
    .select("group_id", { count: "exact", head: true })
    .eq("user_id", viewer.id)
    .eq("banned", false)
    .in("role", ["owner", "admin"]);
  return (count ?? 0) > 0;
}
