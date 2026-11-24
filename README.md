# OneJoy - reading the bible, with joy and striding side by side with other Christians 

OneJoy is a companion for reading a **paper Bible**. Each day the app gives everyone the same chapter.
You read it in your own Bible, tap **"I read it"**, and share what stood out with your groups and with
everyone else reading that chapter in the daily **global thread**.

> Built as a full-stack portfolio project: Next.js 16 + Supabase (Postgres, Auth, row-level security),
> fully free to run.

**Features**

- **Chapter of the day:** one shared reading plan (editable by site admins).
- **Weekly streaks:** set a goal like "3 days a week". A week counts when you hit it, so missing a day doesn't break the habit.
- **Groups:** public or private, tagged with a Protestant denomination, joined by invite link (private) or freely (public). Owners and admins manage members.
- **Posts:** reading reflections (with a verse you type yourself), plus general posts like prayer requests in groups. Comments and 🙏 reactions.
- **Global thread:** one discussion per day about the shared chapter, with a browsable archive.
- **Moderation:** visible rules, reporting, a moderation queue, remove / warn / mute (1 or 7 days) / ban, blocking, a newcomer "slow mode" and an action log.
- **Read-only demo account** so visitors can look around without signing up.
- Light and dark mode, mobile-first layout.

## Architecture

```
Browser ──► Next.js (App Router, Server Components + Server Actions) ──► Supabase
             │  src/proxy.ts: refreshes the session cookie, redirects      │  Postgres + RLS
             │  pages render a static shell, signed-in data streams in    │  security-definer RPCs
             └─ zod validation, friendly error mapping                     └  Supabase Auth
```

**The database enforces every rule.** Clients only hold the publishable key, so all access control lives in Postgres:

- **Row-level security on every table.** Private group content is invisible to non-members, including site admins.
- **No direct writes from clients.** Posting, check-ins and moderation go through `security definer` functions that check membership, mutes, bans, slow mode, today's date and the demo flag. They raise short error codes (`not_checked_in`, `slow_mode`, …) that the UI maps to friendly text (`src/lib/errors.ts`).
- **Feeds are views** (`feed_posts`, `feed_comments`). They hide removed text from non-moderators and drop content from users you've blocked. The base tables have no client read access, so removed text can't leak through the API.
- **Moderation records outlive account deletion** via username snapshots, so deleting an account can't erase a ban.
- **Streak maths is a pure function** (`src/lib/streak.ts`): Monday–Sunday weeks in the user's own timezone, using the goal that applied in each week.

**Why no Bible text?** OneJoy is meant to send people to their paper Bibles. Leaving the text out also avoids translation licensing (NIV and ESV need permission for apps, and YouVersion's API terms forbid apps that compete with its Bible App). Users can still quote a verse by typing it themselves.

## Tests

| Command | What it covers |
| --- | --- |
| `npm test` | Vitest unit tests: streaks, timezones, validation, error mapping, the book list |
| `npm run test:db` | pgTAP tests against local Postgres: every RLS rule and RPC (private groups, bans, mutes, slow mode, blocking, removed content, account deletion, demo read-only…) |
| `npm run e2e` | Playwright: sign-up → check-in → share → streak, plus the private-group invite flow with two users |

## Run it locally

Needs Node 22+ and Docker Desktop (running).

```bash
npm install
npx supabase start             # local Postgres + Auth in Docker; prints URL and keys
cp .env.example .env.local     # fill in the values printed above (+ DEMO_EMAIL / DEMO_PASSWORD)
npm run db:reset               # applies migrations, including the reading plan
npx tsx scripts/seed-demo.ts   # optional: demo account + sample group
npm run dev                    # http://localhost:3000
```

To make yourself a site admin (schedule editor, global-thread moderation), run this in Supabase Studio's SQL editor (http://127.0.0.1:54323):

```sql
update public.profiles set is_site_admin = true where username = 'your_username';
```

## Deploy (free)

1. **Supabase:** create a free project. Then:
   - Run `npx supabase login`, `npx supabase link --project-ref <ref>` and `npx supabase db push` to apply the migrations.
   - In *Authentication → Sign In / Providers → Email*, turn off **Confirm email**. The built-in email sender is heavily rate-limited; add a free SMTP provider later if you want confirmations or magic links.
2. **Vercel:** import the GitHub repo and set the environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `DEMO_EMAIL` and `DEMO_PASSWORD`

   The secret key is **not** needed on Vercel.
3. **Demo data:** put the hosted values (including `SUPABASE_SECRET_KEY`) in your local `.env.local`, then run `npx tsx scripts/seed-demo.ts`.
4. **Site admin:** sign up on the live site, then run the SQL above in the Supabase dashboard.

**Free-tier notes:**

- Supabase pauses free projects after about a week with no activity. Open the site now and then, or add a scheduled ping.
- Vercel Hobby is for non-commercial use.

## Project layout

```
supabase/migrations/   schema, RLS policies, RPCs, reading plan
supabase/tests/        pgTAP tests
src/app/(auth)/        sign in / sign up / demo
src/app/(app)/         today, global archive, groups, posts, moderation, admin, settings
src/components/        UI pieces (PostCard, ContentMenu, StreakCard, …)
src/lib/               streak + date logic, validation, Supabase clients
scripts/seed-demo.ts   demo account + sample data
tests/                 unit + e2e tests
```
