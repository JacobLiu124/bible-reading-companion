"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signInErrorMessage, signUpErrorMessage } from "@/lib/auth-errors";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";
import { firstIssue, signInSchema, signUpSchema } from "@/lib/validation";

export type AuthState = { error?: string; checkEmail?: string } | undefined;

/** The site's own origin, so the confirmation email links back to whichever deploy you signed up on. */
async function siteOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { email, password, username, displayName, timezone } = parsed.data;

  const supabase = await createClient();
  const { data: available } = await supabase.rpc("username_available", { name: username });
  if (available === false) return { error: "That username is taken." };

  const next = safeNext(formData.get("next"));
  const confirm = new URL("/auth/confirm", await siteOrigin());
  confirm.searchParams.set("next", next);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, display_name: displayName, timezone }, emailRedirectTo: confirm.toString() },
  });
  if (error) {
    // The page shows friendly copy, so keep the real reason in the server logs (no email or password).
    console.error("sign-up failed:", error.code ?? error.status, error.message);
    return { error: signUpErrorMessage(error) };
  }
  // With "Confirm email" on, Supabase creates the account but gives no session until the link is opened.
  if (!data.session) return { checkEmail: email };
  redirect(next);
}

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: signInErrorMessage(error) };
  redirect(safeNext(formData.get("next")));
}

export async function signInDemo(): Promise<AuthState> {
  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;
  if (!email || !password) return { error: "The demo isn't set up yet." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "The demo isn't available right now." };
  redirect("/today");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
