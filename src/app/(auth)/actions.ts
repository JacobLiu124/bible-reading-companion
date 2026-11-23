"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { firstIssue, signInSchema, signUpSchema } from "@/lib/validation";

export type AuthState = { error?: string } | undefined;

function safeNext(next: FormDataEntryValue | null): string {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/today";
}

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { email, password, username, displayName, timezone } = parsed.data;

  const supabase = await createClient();
  const { data: available } = await supabase.rpc("username_available", { name: username });
  if (available === false) return { error: "That username is taken." };

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, display_name: displayName, timezone } },
  });
  if (error) {
    return {
      error: /already registered/i.test(error.message)
        ? "That email already has an account."
        : error.message,
    };
  }
  redirect(safeNext(formData.get("next")));
}

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Email or password is incorrect." };
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
