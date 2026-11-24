import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Clears the session and goes to sign-in. Used when a session's token is still valid
 * but its account no longer exists (e.g. deleted on another device) — otherwise the
 * proxy (token looks fine → /today) and the page (no profile → /sign-in) bounce forever.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" }).catch(() => {});
  const response = NextResponse.redirect(new URL("/sign-in", request.url));
  // Belt and braces: drop any Supabase auth cookies even if signOut couldn't.
  for (const c of request.cookies.getAll()) {
    if (c.name.startsWith("sb-")) response.cookies.delete(c.name);
  }
  return response;
}
