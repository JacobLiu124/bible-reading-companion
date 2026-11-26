import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

/**
 * Where the "confirm your email" link lands. Supabase sends either a one-time `code` (the default
 * PKCE flow, which only works in the browser that signed up) or a `token_hash` (custom email
 * templates, which works anywhere). Either way: sign the person in and take them to Today.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNext(params.get("next"));
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const supabase = await createClient();

  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  }

  if (ok) return NextResponse.redirect(new URL(next, request.url));
  // Supabase adds `error` when the link itself was bad (expired or already used). Otherwise the email
  // was confirmed but the code exchange failed, usually because the link was opened in a different
  // browser, so signing in by hand works.
  const result = code && !params.get("error") ? "1" : "failed";
  return NextResponse.redirect(new URL(`/sign-in?confirmed=${result}`, request.url));
}
