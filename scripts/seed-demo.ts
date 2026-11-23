/**
 * Creates (or refreshes) the read-only demo account and its sample data.
 * Works against local Supabase or a hosted project.
 *
 *   npx tsx scripts/seed-demo.ts
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, DEMO_EMAIL, DEMO_PASSWORD from .env.local.
 * The secret key bypasses row-level security: keep it out of git and out of the browser.
 */
import { config } from "dotenv";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/database.types";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const demoEmail = process.env.DEMO_EMAIL;
const demoPassword = process.env.DEMO_PASSWORD;
if (!url || !secret || !demoEmail || !demoPassword) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, DEMO_EMAIL and DEMO_PASSWORD in .env.local");
  process.exit(1);
}

const db = createClient<Database>(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
const ago = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

async function must<R extends { data: unknown; error: unknown }>(
  p: PromiseLike<R>,
  what: string,
): Promise<NonNullable<R["data"]>> {
  const { data, error } = await p;
  if (error) throw new Error(`${what}: ${JSON.stringify(error)}`);
  return data as NonNullable<R["data"]>;
}

async function ensureUser(email: string, password: string, username: string, displayName: string) {
  const list = await must(db.auth.admin.listUsers({ perPage: 1000 }), "list users");
  const existing = list.users.find((u) => u.email === email);
  if (existing) return existing.id;
  const created = await must(
    db.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { username, display_name: displayName, timezone: "UTC" },
    }),
    `create ${username}`,
  );
  return created.user!.id;
}

async function main() {
  const randomPw = () => randomBytes(18).toString("base64url");
  const demo = await ensureUser(demoEmail!, demoPassword!, "demo", "Demo Reader");
  const ruth = await ensureUser("ruth@demo.lamp", randomPw(), "ruth_m", "Ruth Miller");
  const sam = await ensureUser("sam@demo.lamp", randomPw(), "samuel_o", "Samuel Okafor");
  const grace = await ensureUser("grace@demo.lamp", randomPw(), "grace_lee", "Grace Lee");
  const people = [demo, ruth, sam, grace];

  await must(db.from("profiles").update({ is_demo: true, weekly_goal: 3 }).eq("id", demo), "flag demo");
  await must(db.from("profiles").update({ created_at: ago(24 * 40) }).in("id", people), "backdate profiles");
  await must(db.from("profiles").update({ denomination: "baptist" }).eq("id", ruth), "denom");
  await must(db.from("profiles").update({ denomination: "anglican" }).eq("id", sam), "denom");

  // Reset previous demo content.
  await must(db.from("groups").delete().eq("slug", "demo-fellowship"), "delete old group");
  await must(db.from("posts").delete().in("author_id", people), "delete old posts");
  await must(db.from("check_ins").delete().in("user_id", people), "delete old check-ins");

  // A public group everyone is in.
  const group = await must(
    db.from("groups").insert({
      name: "Demo Fellowship", slug: "demo-fellowship", visibility: "public", denomination: "non_denominational",
      description: "A sample group so you can see how Lamp works.",
      rules: "Be kind. Assume the best. Stay on topic.", owner_id: ruth,
    }).select().single(),
    "create group",
  );
  await must(
    db.from("group_members").insert([
      { group_id: group.id, user_id: ruth, role: "owner", joined_at: ago(24 * 30) },
      { group_id: group.id, user_id: sam, role: "admin", joined_at: ago(24 * 30) },
      { group_id: group.id, user_id: grace, role: "member", joined_at: ago(24 * 20) },
      { group_id: group.id, user_id: demo, role: "member", joined_at: ago(24 * 20) },
    ]),
    "members",
  );

  // Check-ins: the demo user has met a goal of 3 for each of the last three weeks, plus today.
  const checkIns: { user_id: string; local_date: string }[] = [];
  for (let d = -21; d <= 0; d++) {
    if (d % 2 === 0) for (const u of people) checkIns.push({ user_id: u, local_date: day(d) });
  }
  await must(db.from("check_ins").upsert(checkIns), "check-ins");

  // Reading posts for today and yesterday, in the group and the global thread.
  const schedule = await must(db.from("reading_schedule").select("day, label").in("day", [day(0), day(-1)]), "schedule");
  const label = (d: string) => schedule.find((s) => s.day === d)?.label ?? "John 1";
  const reading = (author: string, d: string, gid: string | null, body: string, verseRef: string | null, verseText: string | null, hours: number) => ({
    kind: "reading", author_id: author, group_id: gid, reading_date: d, reference: label(d),
    body, verse_ref: verseRef, verse_text: verseText, created_at: ago(hours),
  });
  const posts = await must(
    db.from("posts").insert([
      reading(ruth, day(0), null, "I read this slowly over breakfast. What struck me is how personal it is — not a distant God but one who comes close.", null, null, 2),
      reading(sam, day(0), null, "Underlined this one in my Bible years ago and it still lands.", `${label(day(0))}:5`, "The light shineth in darkness; and the darkness comprehended it not.", 4),
      reading(grace, day(0), group.id, "Short one today but I keep coming back to it.", null, null, 3),
      reading(sam, day(-1), null, "Yesterday's chapter made me want to read the whole book again.", null, null, 26),
      { kind: "general", author_id: grace, group_id: group.id, title: "Prayer request", body: "Starting a new job on Monday and feeling nervous. Would appreciate your prayers!", created_at: ago(20) },
      { kind: "general", author_id: ruth, group_id: group.id, title: "Welcome!", body: "Welcome to the demo group 👋 This is where your church or friends would share what stood out each day.", created_at: ago(24 * 6) },
    ]).select("id, author_id, title"),
    "posts",
  );

  const byTitle = (t: string) => posts.find((p) => p.title === t)!.id;
  const first = posts[0].id;
  await must(
    db.from("comments").insert([
      { post_id: first, author_id: sam, body: "Same here. Verse 14 especially.", created_at: ago(1.5) },
      { post_id: first, author_id: grace, body: "Love that — \"comes close\" is a good way to put it.", created_at: ago(1) },
      { post_id: byTitle("Prayer request"), author_id: ruth, body: "Praying for you, Grace! 🙏", created_at: ago(18) },
      { post_id: byTitle("Prayer request"), author_id: sam, body: "You'll do great.", created_at: ago(17) },
    ]),
    "comments",
  );
  await must(
    db.from("reactions").insert([
      { post_id: first, user_id: sam }, { post_id: first, user_id: grace },
      { post_id: posts[1].id, user_id: ruth },
      { post_id: byTitle("Prayer request"), user_id: ruth }, { post_id: byTitle("Prayer request"), user_id: sam },
    ]),
    "reactions",
  );

  console.log(`Demo ready: ${demoEmail} (read-only), group /groups/demo-fellowship, ${posts.length} posts.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
