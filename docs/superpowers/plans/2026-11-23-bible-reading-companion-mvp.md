# Lamp (Bible Reading Companion) MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A deployed web app where friends read a shared daily chapter in their paper Bibles, check in, keep weekly streaks, and discuss in groups and a daily global thread.

**Architecture:** One Next.js (App Router, TypeScript) app for UI and server actions, talking to Supabase (Postgres + Auth). All access rules and business rules (who can read/post, check-in rules, slow mode, mutes/bans, demo read-only) live in the database as RLS policies, constraints, triggers and `security definer` RPCs, proven by pgTAP tests. Streak maths is a pure TypeScript module with unit tests.

**Tech Stack:** Next.js (latest, via `create-next-app@latest`), TypeScript, Tailwind CSS, shadcn/ui, `@supabase/ssr` + `@supabase/supabase-js`, zod, Vitest, Supabase CLI (`npx supabase`, local stack on Docker) with pgTAP, Playwright (one smoke test). Hosting: Vercel Hobby + Supabase Free.

**Spec:** `docs/superpowers/specs/2026-11-23-bible-reading-companion-design.md`

## Global Constraints

- Free tiers only (Vercel Hobby, Supabase Free). No paid services, no Bible APIs, no YouVersion APIs.
- No Bible text stored or shown except verses users type themselves (verse text ≤ 500 chars).
- Protestant only. Denomination values (exact): `anglican` "Anglican/Episcopal", `baptist` "Baptist", `lutheran` "Lutheran", `methodist` "Methodist", `presbyterian_reformed` "Presbyterian/Reformed", `pentecostal_charismatic` "Pentecostal/Charismatic", `non_denominational` "Non-denominational", `other_protestant` "Other Protestant".
- RLS enabled on every table in `public`. Clients only use the publishable key; the secret key is used only by `scripts/seed-demo.ts`, run locally by the owner, never committed or pasted in chat.
- Passwords never stored by the app (Supabase Auth). Email confirmation off.
- Weekly goal 1–7, default 3. Weeks Monday–Sunday in the user's timezone (IANA name stored on profile).
- "Today" for a user = `(now() at time zone profile.timezone)::date`. Check-ins only for today.
- Limits: reflection/body ≤ 1000 chars, comment ≤ 1000, verse text ≤ 500, group name 3–60, rules ≤ 2000.
- Slow mode: first 48 hours in a group (global thread: first 48 hours of account age) → max 3 posts and 10 comments per rolling hour in that space.
- Mute durations: 1 day or 7 days.
- Site admins: full moderation in public groups + global thread; **no** read or write access to private groups.
- Demo account (`profiles.is_demo = true`) is read-only everywhere.
- UI: calm, readable, mobile-first, light + dark mode. Copy nudge on Today: "Grab your Bible."
- DB error codes (raised as `raise exception '<code>'`, mapped to friendly copy in `src/lib/errors.ts`): `not_checked_in`, `not_today`, `no_reading_today`, `muted`, `banned`, `slow_mode`, `demo_read_only`, `global_reading_only`, `not_member`, `forbidden`, `owner_must_transfer`.

## Review Focus

1. **Timezone edges** — a user in Pacific/Auckland checking in at 00:30 local gets *their* date's chapter and the check-in lands in the right Mon–Sun week. (Tests in Task 2 and Task 6.)
2. **Leaving/ban takes effect immediately** — a removed or banned member of a private group can no longer read its posts or comments. (Test in Task 3.)
3. **Removed content hides its text** — a removed post/comment shows "removed by a moderator" and its body is not returned to non-moderators, even via direct API. (Test in Task 5.)
4. **Blocking hides everywhere** — a blocked user's posts and comments disappear from the blocker's group feeds *and* the global thread. (Test in Task 4.)
5. **No schedule for today** — check-in still works (streaks are not punished), but reading posts are refused with `no_reading_today` and Today shows "No reading scheduled today". (Tests in Task 2 and Task 4.)

---

## File Structure

```
supabase/
  config.toml                         (supabase init)
  migrations/
    20261123000001_profiles_checkins.sql
    20261123000002_groups.sql
    20261123000003_posts.sql
    20261123000004_moderation.sql
    20261123000005_reading_plan.sql
  seed.sql                            local-only demo data
  tests/
    01_profiles_checkins.test.sql
    02_groups.test.sql
    03_posts.test.sql
    04_moderation.test.sql
    helpers.sql                       test helpers (create user, act as user)
scripts/
  seed-demo.ts                        creates demo account + demo group in prod
src/
  lib/
    supabase/server.ts, client.ts, middleware.ts
    dates.ts        localToday, weekStart
    streak.ts       computeStreak
    errors.ts       DB error code -> message
    validation.ts   zod schemas
    denominations.ts
    database.types.ts (generated)
  middleware.ts (or proxy.ts on Next 16+)
  app/
    page.tsx                      landing (signed out) / redirect to /today
    (auth)/sign-in, sign-up       pages + actions.ts
    privacy/page.tsx
    (app)/layout.tsx              shell, nav, notices banner
    (app)/today/page.tsx + actions.ts
    (app)/global/[date]/page.tsx
    (app)/groups/page.tsx, new/page.tsx, [slug]/page.tsx, [slug]/settings/page.tsx, actions.ts
    (app)/invite/[code]/page.tsx
    (app)/posts/[id]/page.tsx + actions.ts
    (app)/moderation/page.tsx + actions.ts
    (app)/admin/schedule/page.tsx + actions.ts
    (app)/settings/page.tsx + actions.ts
  components/  PostCard, PostComposer, CommentList, ReactionButton, ReportDialog,
               StreakCard, CheckInButton, NoticeBanner, GroupCard, ui/* (shadcn)
tests/
  unit/dates.test.ts, streak.test.ts, validation.test.ts, errors.test.ts
  e2e/smoke.spec.ts
```

---

### Task 1: Scaffold repo, tooling and local Supabase

**Files:**
- Create: Next.js app at repo root, `vitest.config.ts`, `.env.example`, `.gitignore` additions, `supabase/config.toml`, `README.md` (skeleton), `tests/unit/sanity.test.ts`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `lint`, `test` (vitest run), `test:db` (`supabase test db`), `db:reset` (`supabase db reset`), `db:types` (`supabase gen types typescript --local > src/lib/database.types.ts`), `e2e` (playwright test). Env names: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `DEMO_EMAIL`, `DEMO_PASSWORD`.

- [ ] **Step 1:** `git init -b main`; run `npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm` (move `docs/` aside and back if the tool refuses a non-empty folder).
- [ ] **Step 2:** Install `@supabase/ssr @supabase/supabase-js zod` and dev deps `vitest @vitejs/plugin-react vite-tsconfig-paths supabase @playwright/test`. Init shadcn/ui (`npx shadcn@latest init`, neutral base, CSS variables, dark mode via `class`).
- [ ] **Step 3:** `npx supabase init`; in `config.toml` set `[auth.email] enable_confirmations = false`. Add `.env.example` with the five names above (empty values) and ensure `.env*.local` is git-ignored.
- [ ] **Step 4:** Write `tests/unit/sanity.test.ts` (`expect(1+1).toBe(2)`); run `npm test` → PASS. Run `npm run build` → succeeds.
- [ ] **Step 5:** Run `npx supabase start` (Docker must be running) → prints local API URL and publishable key; put them in `.env.local`.
- [ ] **Step 6:** Commit `chore: scaffold Next.js + Supabase project`.

### Task 2: Profiles, goals, schedule, check-ins (schema + RLS + tests)

**Files:**
- Create: `supabase/migrations/20261123000001_profiles_checkins.sql`, `supabase/tests/helpers.sql`, `supabase/tests/01_profiles_checkins.test.sql`

**Interfaces:**
- Produces tables:
  - `profiles(id uuid pk references auth.users on delete cascade, username citext unique not null check 3–24 chars [a-z0-9_], display_name text not null, denomination text null check in list, timezone text not null default 'UTC', weekly_goal int not null default 3 check 1–7, is_site_admin bool default false, is_demo bool default false, created_at timestamptz default now())`
  - `goal_history(user_id uuid references profiles on delete cascade, effective_week_start date, goal int check 1–7, pk(user_id, effective_week_start))`
  - `reading_schedule(day date pk, book text not null, chapter int not null, label text not null)` e.g. label `'John 3'`
  - `check_ins(user_id uuid references profiles on delete cascade, local_date date, created_at timestamptz default now(), pk(user_id, local_date))`
- Produces SQL functions (all `security definer`, `set search_path = public`):
  - `user_today(uid uuid) returns date`
  - `week_start(d date) returns date` (Monday)
  - `is_site_admin(uid uuid) returns boolean`, `is_demo(uid uuid) returns boolean`
  - `check_in() returns date` — inserts today's row for `auth.uid()`, idempotent (on conflict do nothing), raises `demo_read_only` for demo; returns the local date.
  - `set_weekly_goal(goal int) returns void` — updates profile and upserts `goal_history` for `week_start(user_today)`.
  - Trigger `on_auth_user_created` on `auth.users` inserts a profile from `raw_user_meta_data` keys `username`, `display_name`, `timezone` and a `goal_history` row (goal 3, current week).
- RLS: profiles readable by any authenticated user; users update only their own row and cannot change `is_site_admin`/`is_demo` (column-level `revoke update` + grant on editable columns); `reading_schedule` readable by authenticated, writable only by site admins; `check_ins` and `goal_history` select own rows only, no direct insert (RPC only).
- Test helpers in `helpers.sql`: `tests.create_user(email text, username text, tz text default 'UTC') returns uuid`, `tests.act_as(uid uuid)` (sets role `authenticated` and `request.jwt.claims` sub), `tests.act_as_anon()`.

- [ ] **Step 1: Write failing pgTAP tests** in `01_profiles_checkins.test.sql`:
  - signup trigger creates profile with given username/timezone and goal_history row goal 3
  - `check_in()` twice same day → exactly 1 row
  - user in `Pacific/Auckland` with `now()` frozen at `2026-11-23 11:30Z` → `check_in()` returns `2026-11-24` (freeze by passing time via a `tests.set_now()` helper or by asserting `user_today` against `(now() at time zone tz)::date` — choose one and use it consistently)
  - user A cannot select user B's check_ins
  - user cannot `update profiles set is_site_admin = true` (throws)
  - non-admin insert into `reading_schedule` fails; admin succeeds
  - check-in works when `reading_schedule` has no row for today
  - demo user `check_in()` throws `demo_read_only`
  - anon cannot select profiles
- [ ] **Step 2:** `npm run test:db` → FAIL (tables missing).
- [ ] **Step 3:** Write the migration to make them pass.
- [ ] **Step 4:** `npm run db:reset && npm run test:db` → all PASS.
- [ ] **Step 5:** Commit `feat(db): profiles, goals, schedule, check-ins with RLS`.

### Task 3: Groups, membership, invites (schema + RLS + RPCs + tests)

**Files:**
- Create: `supabase/migrations/20261123000002_groups.sql`, `supabase/tests/02_groups.test.sql`

**Interfaces:**
- Consumes: `is_site_admin`, `is_demo`, test helpers.
- Produces tables:
  - `groups(id uuid pk default gen_random_uuid(), name text, slug text unique, description text default '', rules text default '', visibility text check in ('public','private'), denomination text null, owner_id uuid references profiles on delete set null, created_at)`
  - `group_members(group_id uuid references groups on delete cascade, user_id uuid references profiles on delete cascade, role text check in ('owner','admin','member'), joined_at timestamptz default now(), muted_until timestamptz null, banned bool default false, pk(group_id,user_id))`
  - `group_invites(code text pk default encode(gen_random_bytes(9),'base64url-ish'), group_id uuid references groups on delete cascade, created_by uuid, expires_at timestamptz, revoked bool default false)`
- Produces functions:
  - `is_active_member(gid uuid, uid uuid) returns boolean` (member and not banned)
  - `group_role(gid uuid, uid uuid) returns text` (null if not active member)
  - `can_read_group(gid uuid, uid uuid) returns boolean` = public group OR active member
  - `can_moderate_group(gid uuid, uid uuid) returns boolean` = role in (owner, admin) OR (site admin AND group is public)
  - RPCs: `create_group(name text, description text, rules text, visibility text, denomination text) returns groups` (slug from name + short suffix, creator becomes owner), `join_public_group(gid uuid)`, `create_invite(gid uuid, days int default 7) returns text`, `redeem_invite(code text) returns groups`, `leave_group(gid uuid)` (owner → `owner_must_transfer`), `transfer_ownership(gid uuid, new_owner uuid)`, `set_member_role(gid uuid, uid uuid, role text)` (owner only; role admin|member), `update_group(gid uuid, name, description, rules, denomination)` (owner/admin).
  - Banned users cannot rejoin via `join_public_group` or `redeem_invite` (raise `banned`).
- RLS: `groups` select where `can_read_group`; `group_members` select where `can_read_group(group_id)`; invites select only for moderators of that group; all writes via RPCs only.

- [ ] **Step 1: Write failing tests**:
  - creator is owner; private group invisible to non-member; public group visible to non-member
  - **site admin cannot select a private group or its members**
  - `redeem_invite` adds member; expired or revoked code fails
  - member leaves → can no longer see private group (Review Focus 2)
  - banned member cannot see private group and cannot rejoin (`banned`)
  - owner `leave_group` → `owner_must_transfer`; after `transfer_ownership` it works
  - non-owner `set_member_role` → `forbidden`
  - demo user `create_group` → `demo_read_only`
- [ ] **Step 2:** `npm run test:db` → new tests FAIL.
- [ ] **Step 3:** Write the migration.
- [ ] **Step 4:** `npm run db:reset && npm run test:db` → PASS.
- [ ] **Step 5:** Commit `feat(db): groups, membership and invites`.

### Task 4: Posts, comments, reactions, blocks (schema + rules + tests)

**Files:**
- Create: `supabase/migrations/20261123000003_posts.sql`, `supabase/tests/03_posts.test.sql`

**Interfaces:**
- Consumes: Task 2 and 3 functions.
- Produces tables:
  - `posts(id uuid pk, kind text check in ('reading','general'), author_id uuid references profiles on delete cascade, group_id uuid null references groups on delete cascade, reading_date date null, reference text null, title text null, body text null check ≤1000, verse_ref text null, verse_text text null check ≤500, created_at, edited_at, removed_at, removed_by uuid null)` with checks: reading ⇒ reading_date and reference not null and title null; general ⇒ group_id not null; reading needs body or verse_text; general needs body.
  - `comments(id uuid pk, post_id uuid references posts on delete cascade, author_id uuid references profiles on delete cascade, body text check 1–1000, created_at, edited_at, removed_at, removed_by)`
  - `reactions(post_id uuid, user_id uuid, kind text default 'pray' check in ('pray'), pk(post_id,user_id,kind))`
  - `blocks(blocker_id uuid, blocked_id uuid, pk(...), check blocker<>blocked)`
- Produces RPCs:
  - `create_reading_post(group_ids uuid[], to_global bool, body text, verse_ref text, verse_text text) returns setof posts` — one row per destination; requires today's check-in (`not_checked_in`), a schedule row for today (`no_reading_today`), active membership not muted/banned per group (`not_member`/`muted`/`banned`), global restriction check (Task 5 table — leave a hook function `global_restriction(uid) returns text` returning null for now), slow mode (`slow_mode`), demo (`demo_read_only`). Sets `reading_date = user_today`, `reference = schedule.label`.
  - `create_general_post(group_id uuid, title text, body text) returns posts` — same membership/mute/slow-mode/demo rules.
  - `add_comment(post_id uuid, body text) returns comments` — requires can_read the post's space and, for group posts, active non-muted membership; global: global restriction; slow mode (10/hour).
  - `toggle_reaction(post_id uuid) returns boolean` (now reacted?)
  - `edit_post(id, body, verse_ref, verse_text, title)`, `delete_post(id)` (author only, hard delete), same for comments.
  - Global rule: new global posts only `kind='reading'` (`global_reading_only`) and only for today's date (`not_today`); comments on past global posts allowed.
  - `block_user(uid)`, `unblock_user(uid)`.
- Produces views (security_invoker) used by the app for reading:
  - `feed_posts` — posts the caller can read (`group_id is null` or `can_read_group`), excluding authors the caller blocked, with `body`, `verse_ref`, `verse_text`, `title` nulled when `removed_at is not null` unless caller `can_moderate`; plus `author_username`, `author_display_name`, `reaction_count`, `reacted_by_me`, `comment_count`.
  - `feed_comments` — same rules for comments.
  - Base tables: direct select allowed only to rows the caller can read **and** not removed (moderators read removed rows via the view).

- [ ] **Step 1: Write failing tests**:
  - reading post without check-in → `not_checked_in`; with check-in but no schedule → `no_reading_today` (Review Focus 5)
  - reading post to 2 groups + global → 3 rows, comments on one don't appear on another
  - general post to global (null group) → fails
  - non-member posting to private group → `not_member`; non-member reading private posts → 0 rows
  - muted member posting → `muted`
  - 4th post within an hour by a member who joined < 48h ago → `slow_mode`; member who joined 3 days ago (backdate `joined_at`) → allowed
  - new global post with old date impossible; comment on yesterday's global post allowed
  - B blocked by A: B's posts and comments absent from A's `feed_posts`/`feed_comments` in a group and in global (Review Focus 4)
  - toggle_reaction twice → back to 0
  - demo user any write RPC → `demo_read_only`
- [ ] **Step 2:** `npm run test:db` → FAIL.
- [ ] **Step 3:** Write the migration.
- [ ] **Step 4:** `npm run db:reset && npm run test:db` → PASS.
- [ ] **Step 5:** Commit `feat(db): posts, comments, reactions and blocks`.

### Task 5: Moderation, reports, notices, account deletion (schema + tests)

**Files:**
- Create: `supabase/migrations/20261123000004_moderation.sql`, `supabase/tests/04_moderation.test.sql`

**Interfaces:**
- Consumes: `can_moderate_group`, `is_site_admin`, posts/comments.
- Produces tables (user refs `on delete set null`, plus `*_username` text snapshots):
  - `reports(id, reporter_id, reporter_username, post_id null, comment_id null, group_id null (denormalised; null = global), reason text check in ('spam','harassment','inappropriate','other'), note text ≤500, status text check in ('open','resolved','dismissed') default 'open', created_at, resolved_by, resolved_at)`
  - `moderation_actions(id, group_id null (null = global), target_user_id, target_username, actor_id, actor_username, action text check in ('remove_post','remove_comment','warn','mute','ban','unban','delete_group'), reason text, created_at, expires_at)`
  - `global_restrictions(user_id pk references profiles on delete cascade, muted_until timestamptz null, banned bool default false)`
  - `notices(id, user_id references profiles on delete cascade, kind text default 'warning', message text, created_at, acknowledged_at null)`
- Produces RPCs: `report_content(post_id uuid, comment_id uuid, reason text, note text)`, `remove_post(id uuid, reason text)`, `remove_comment(id uuid, reason text)`, `warn_user(group_id uuid, uid uuid, message text)` (null group = global; inserts notice), `mute_user(group_id uuid, uid uuid, days int)` (days in (1,7)), `ban_user(group_id uuid, uid uuid, reason text)`, `unban_user(group_id uuid, uid uuid)`, `delete_group(gid uuid, reason text)` (site admin + public group only, or owner), `resolve_report(id uuid, status text)`, `acknowledge_notice(id uuid)`, `delete_my_account()` (deletes `auth.users` row for `auth.uid()`; not allowed for demo).
  - Replace Task 4's `global_restriction(uid)` to return `'banned'`/`'muted'`/null from `global_restrictions`.
- RLS: reports visible to reporter (own) and to moderators of the space (`can_moderate_group(group_id)`, or site admin when group_id null); moderation_actions visible to moderators of that space; notices visible to their user.

- [ ] **Step 1: Write failing tests**:
  - group admin removes a post → member reading `feed_posts` sees row with null body; base table select hides it; admin still sees body (Review Focus 3)
  - site admin can remove/ban in a public group; site admin calling any of these on a private group → `forbidden`, and cannot see its reports
  - group admin cannot moderate a different group → `forbidden`
  - `warn_user` creates a notice only the target sees; `acknowledge_notice` sets timestamp
  - globally banned user `create_reading_post(... to_global true)` → `banned`; group posts still work
  - `mute_user` with days=3 → fails check
  - `delete_my_account` → profile gone, posts gone, `moderation_actions.target_user_id` null and `target_username` kept
  - `delete_group` by site admin on public group → group and its posts gone, action logged
- [ ] **Step 2:** `npm run test:db` → FAIL.
- [ ] **Step 3:** Write the migration.
- [ ] **Step 4:** `npm run db:reset && npm run test:db` → PASS.
- [ ] **Step 5:** Commit `feat(db): moderation, reports, notices and account deletion`.

### Task 6: Reading plan migration, dates, streak logic

**Files:**
- Create: `supabase/migrations/20261123000005_reading_plan.sql`, `src/lib/dates.ts`, `src/lib/streak.ts`, `tests/unit/dates.test.ts`, `tests/unit/streak.test.ts`

**Interfaces:**
- Produces:
  - `localToday(timeZone: string, now?: Date): string` → `'YYYY-MM-DD'` (use `Intl.DateTimeFormat('en-CA', { timeZone })`)
  - `weekStart(date: string): string` → Monday `'YYYY-MM-DD'`
  - `computeStreak(input: { checkIns: string[]; goalHistory: { effectiveWeekStart: string; goal: number }[]; today: string }): { current: number; best: number; thisWeekCount: number; thisWeekGoal: number }`
- Reading plan: migration inserts consecutive days starting `2026-11-23` from this ordered list (book, chapters): John 21, Mark 16, Psalms 150, Acts 28, Romans 16, Proverbs 31, Genesis 50, Luke 24, Philippians 4, Ephesians 6, James 5, Matthew 28, Exodus 40 — 499 days. Label format `'<Book> <chapter>'` (Psalms label: `'Psalm <n>'`). Use `generate_series`; `on conflict do nothing`.

- [ ] **Step 1: Write failing tests** (`streak.test.ts`), goal from history in effect for each week (latest `effectiveWeekStart` ≤ week start):
  - goal 3, three check-ins Mon/Wed/Fri of last week, none this week, today Tuesday → `current 1`, `thisWeekCount 0`, `thisWeekGoal 3`
  - same plus 3 this week → `current 2`
  - last week missed (2/3), week before met → `current 0`, `best 1`
  - goal raised to 5 this week; last week met with 3 under old goal → last week still counts
  - Sunday check-in and Monday check-in fall in different weeks
  - empty input → all zeros, `thisWeekGoal` = latest goal (default 3 when history empty)
  - `localToday('Pacific/Auckland', new Date('2026-11-23T11:30:00Z'))` → `'2026-11-24'`; `weekStart('2026-11-29')` (Sunday) → `'2026-11-23'`
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement. Algorithm: bucket check-ins by `weekStart`; walk weeks backwards from the week before current; count consecutive met weeks; add 1 if current week met; `best` = longest run over all weeks from first check-in to today (current week only counts if met).
- [ ] **Step 4:** `npm test` → PASS; `npm run db:reset` → schedule has 499 rows (`select count(*)`).
- [ ] **Step 5:** Commit `feat: reading plan, date utils and weekly streak logic`.

### Task 7: Supabase wiring, auth pages, landing, demo sign-in

**Files:**
- Create: `src/lib/supabase/{server,client,middleware}.ts`, `src/middleware.ts` (or `src/proxy.ts` on Next 16+), `src/lib/errors.ts`, `src/lib/validation.ts`, `src/lib/denominations.ts`, `src/app/page.tsx`, `src/app/(auth)/sign-in/page.tsx`, `src/app/(auth)/sign-up/page.tsx`, `src/app/(auth)/actions.ts`, `src/app/privacy/page.tsx`, `tests/unit/validation.test.ts`, `tests/unit/errors.test.ts`; generate `src/lib/database.types.ts`

**Interfaces:**
- Produces: `createClient()` in `server.ts` (async, cookies) and `client.ts`; `getUser()` helper returning `{ user, profile } | null`; `friendlyError(e: unknown): string` mapping every code in Global Constraints; zod schemas `signUpSchema` (email, password ≥ 8, username `^[a-z0-9_]{3,24}$`, displayName 1–40, ageConfirmed literal true, timezone string), `readingPostSchema`, `generalPostSchema`, `commentSchema`, `groupSchema` (limits from Global Constraints).
- Server actions: `signUp(formData)`, `signIn(formData)`, `signOut()`, `signInDemo()` (uses `DEMO_EMAIL`/`DEMO_PASSWORD`; if unset, button hidden).
- Middleware: refresh session; signed-out users hitting `(app)` routes → `/sign-in`; signed-in users at `/`, `/sign-in`, `/sign-up` → `/today`.

- [ ] **Step 1: Write failing tests**: `validation.test.ts` (bad username `Ab`, missing age checkbox, body 1001 chars rejected; valid inputs pass); `errors.test.ts` (each code → non-empty friendly string; unknown → generic "Something went wrong").
- [ ] **Step 2:** `npm test` → FAIL. **Step 3:** Implement libs, pages and middleware. Sign-up sends `username`, `display_name`, `timezone` (from `Intl.DateTimeFormat().resolvedOptions().timeZone` in a hidden field) as user metadata. Landing page: one-paragraph pitch, "Sign up", "Sign in", "Try the demo".
- [ ] **Step 4:** `npm test` → PASS; `npm run build` → OK; manually: sign up locally, land on `/today` (placeholder), sign out.
- [ ] **Step 5:** Commit `feat: auth, landing page and demo sign-in`.

### Task 8: App shell and Today page

**Files:**
- Create: `src/app/(app)/layout.tsx`, `src/app/(app)/today/page.tsx`, `src/app/(app)/today/actions.ts`, `src/components/{CheckInButton,StreakCard,PostComposer,PostCard,NoticeBanner,ReactionButton}.tsx`, `src/app/(app)/global/[date]/page.tsx`

**Interfaces:**
- Consumes: `check_in`, `create_reading_post`, `toggle_reaction`, `acknowledge_notice`, `feed_posts`, `computeStreak`, `localToday`.
- Produces: `PostCard` props `{ post: FeedPost; canModerate: boolean }` (reused by Tasks 9–11); `PostComposer` props `{ mode: 'reading' | 'general'; groups?: {id; name}[]; groupId?: string }`.
- Layout: top bar with app name + nav (Today, Groups, Settings; Moderation when user moderates anything; Schedule for site admins); bottom nav on mobile; `NoticeBanner` shows unacknowledged notices; theme toggle (light/dark/system).
- Today: chapter label large ("📖 Today: Psalm 23"), "Grab your Bible." nudge, `CheckInButton` (disabled + "Read ✓" after), `StreakCard` ("2 / 3 this week", current and best streak), after check-in show `PostComposer` titled "What stood out?" with group multi-select + "Global thread" toggle, then today's global thread (`feed_posts` where `group_id is null and reading_date = today`). No schedule → "No reading scheduled today" and composer hidden. Demo users: all write controls disabled with tooltip "Demo is read-only".
- `/global/[date]`: archive of that day's global thread, comments allowed, no new posts.

- [ ] **Step 1:** Implement components and pages.
- [ ] **Step 2:** `npm run build` → OK. Manual check locally: check in, post to global, react, see streak update, toggle dark mode, view on a 375 px wide window.
- [ ] **Step 3:** Commit `feat: Today page with check-in, streak and global thread`.

### Task 9: Groups UI

**Files:**
- Create: `src/app/(app)/groups/page.tsx`, `groups/new/page.tsx`, `groups/[slug]/page.tsx`, `groups/[slug]/settings/page.tsx`, `groups/actions.ts`, `src/app/(app)/invite/[code]/page.tsx`, `src/components/GroupCard.tsx`

**Interfaces:**
- Consumes: group RPCs from Task 3, `create_general_post`, `PostCard`, `PostComposer`.
- Groups page: "My groups" list + "Discover" public directory with name search (`ilike`) and denomination filter; "Create group" button.
- Group page: header (name, denomination badge, public/private), rules box at top, join/leave button, general-post composer for members, feed of both kinds newest first (reading posts labelled with chapter), rules repeated above every comment box (Task 10 component accepts `rules` prop).
- Settings page (owner/admin): edit details, create/revoke invite link (copy button, link `/invite/<code>`), member list with promote/demote (owner), transfer ownership (owner).
- Invite page: shows group name and "Join" button → `redeem_invite`.

- [ ] **Step 1:** Implement. **Step 2:** `npm run build` → OK; manual: two local users — create private group, invite, join, post general + reading posts, confirm second user sees them and a third user cannot. **Step 3:** Commit `feat: groups, invites and group feeds`.

### Task 10: Post detail, comments, edit/delete, report, block

**Files:**
- Create: `src/app/(app)/posts/[id]/page.tsx`, `posts/actions.ts`, `src/components/{CommentList,ReportDialog}.tsx`; Modify: `PostCard.tsx` (menu: edit/delete own, report, block author)

**Interfaces:**
- Consumes: `add_comment`, `edit_post`, `delete_post`, comment equivalents, `report_content`, `block_user`, `unblock_user`, `feed_comments`.
- Post page: the post, flat comments oldest-first, comment box with group rules above it (global: short global rules text in `src/lib/globalRules.ts`), removed items show "Removed by a moderator". Settings page gains a "Blocked users" list with unblock (Task 12 file).
- [ ] **Step 1:** Implement. **Step 2:** `npm run build`; manual: comment, edit, delete, report, block → blocked user's content gone from feeds. **Step 3:** Commit `feat: comments, reporting and blocking`.

### Task 11: Moderation queue and schedule admin

**Files:**
- Create: `src/app/(app)/moderation/page.tsx`, `moderation/actions.ts`, `src/app/(app)/admin/schedule/page.tsx`, `admin/schedule/actions.ts`

**Interfaces:**
- Consumes: Task 5 RPCs, `reports`, `moderation_actions`, `reading_schedule`.
- Moderation page: open reports for spaces the user moderates, each with the content, reporter, reason; actions Remove, Warn (message), Mute 1d/7d, Ban, Dismiss; tab "Log" listing `moderation_actions`. Site admins also see a "Delete group" action on public-group reports.
- Schedule page (site admins only; others → 404): next 60 days table, edit a day (book, chapter → label auto), add days; warning banner when any of the next 7 days is empty.
- [ ] **Step 1:** Implement. **Step 2:** `npm run build`; manual: report as user B, resolve as group admin A, warned user sees banner. **Step 3:** Commit `feat: moderation queue and reading schedule admin`.

### Task 12: Settings and account

**Files:**
- Create: `src/app/(app)/settings/page.tsx`, `settings/actions.ts`

**Interfaces:**
- Consumes: `set_weekly_goal`, profile update, `unblock_user`, `delete_my_account`, `signOut`.
- Fields: display name, denomination (optional select), timezone (select of `Intl.supportedValuesOf('timeZone')`), weekly goal 1–7 (explains "applies from this week"), blocked users list, theme, sign out, Delete account (confirm by typing username). Demo: everything disabled.
- [ ] **Step 1:** Implement. **Step 2:** `npm run build`; manual: change goal, see StreakCard goal change; delete a test account. **Step 3:** Commit `feat: settings and account deletion`.

### Task 13: Seeds, smoke test, README, deploy guide

**Files:**
- Create: `supabase/seed.sql`, `scripts/seed-demo.ts`, `tests/e2e/smoke.spec.ts`, `playwright.config.ts`; Modify: `README.md`

**Interfaces:**
- `seed.sql` (local only): demo user (`demo@lamp.local` / password from comment in file, `is_demo = true`), 3 sample users, public group "Demo Fellowship" (non_denominational) with members, a few reading and general posts, comments, reactions, check-ins giving the demo user a 3-week streak.
- `scripts/seed-demo.ts`: reads `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `DEMO_EMAIL`, `DEMO_PASSWORD` from `.env.local`; idempotently creates the same demo data in a hosted project via the admin API. Run with `npx tsx scripts/seed-demo.ts`.
- Smoke test: sign up new user → `/today` → check in → post reflection to global → sees it in the thread → streak shows "1 / 3 this week".
- README: what it is (portfolio framing), screenshots placeholder, stack and architecture (RLS-first design, why no Bible text), local setup (`npm i`, Docker, `npx supabase start`, `.env.local`, `npm run db:reset`, `npm run dev`), tests (`npm test`, `npm run test:db`, `npm run e2e`), deploy (create Supabase project → `npx supabase link` → `npx supabase db push` → set env vars in Vercel → import repo → set `is_site_admin` for owner via SQL → run seed-demo), notes: Supabase Free pauses after ~1 week idle; enabling email confirmation later with a free SMTP provider.
- [ ] **Step 1:** Write `smoke.spec.ts`; run `npm run e2e` against `npm run dev` with local Supabase → FAIL only if something's broken; fix until PASS.
- [ ] **Step 2:** Run full suite: `npm test && npm run test:db && npm run lint && npm run build && npm run e2e` → all pass.
- [ ] **Step 3:** Commit `chore: seeds, smoke test and README`.

### Task 14 (owner-assisted): Deploy

- [ ] Owner creates a free Supabase project and Vercel account; builder runs `npx supabase link` + `db push`, owner sets env vars in Vercel (secret key only in Vercel/`.env.local`), owner flags themselves site admin, runs `seed-demo`, and confirms the live URL works on a phone.
