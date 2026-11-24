# Bible Reading Companion — MVP Design

Name: **OneJoy** (renamed from the working name "Lamp" on 2026-11-24).
Date: 2026-11-23

## Intent and the why

A web app that helps the owner and their friends read the Bible every day, and do it
together. It is a **companion to a paper Bible**, not a Bible reader: the app tells you
which chapter to read today, you read it in your own Bible, then come back to check in,
reflect, and talk about it with friends and with everyone else reading the same chapter.

It is also a **portfolio piece**, so it should be deployed, genuinely usable by real
friends, and built on visible, well-structured full-stack engineering (auth, database
design, access rules, business logic with tests). It must be **free to build and run**.

## Goals (MVP)

1. A shared, app-wide **chapter of the day** that everyone reads.
2. **Check-in** ("I read it") and an optional post with a reflection and/or a verse that
   stood out.
3. **Weekly streaks** against a user-chosen weekly goal.
4. **Groups**: create public or private groups tagged with a Protestant denomination;
   post your reading to them; comment and react.
5. A **daily global thread** for the chapter of the day.
6. **Moderation basics** so public spaces stay healthy.
7. Secure **email sign-in**.
8. A **decent, clean UI** that works well on phones (web-first, mobile app later).

## Non-goals (later, not now)

- Displaying Bible text in the app (deliberately: encourage paper Bibles; also avoids
  translation licensing entirely).
- Debate section (Kialo-style structured debates).
- Points and shop.
- Map / globe of what friends are reading.
- Live global chat.
- Native mobile app.
- AI features, automated content filtering (OpenAI moderation can be added later).
- Push notifications (possible later via PWA).

## Anti-goals (would make it a failure even if it works)

- Becoming a Bible reader or competing with YouVersion (their API terms forbid
  replicating or competing with the YouVersion Bible App; we use no YouVersion APIs).
- Rewarding skimming or volume (no points for posting; check-ins are honest, not gamed).
- Streak mechanics that punish harshly or create anxiety — weekly goals exist to be
  forgiving.
- Private group content leaking to non-members.
- Storing passwords ourselves.
- Anything that costs money to run at friends-scale.

## Constraints

- **Protestant**: 66-book canon; denominations list is Protestant only.
- **Free tiers only**: Vercel Hobby (hosting), Supabase Free (Postgres + Auth).
  - Supabase Free pauses a project after ~1 week of no activity; acceptable for MVP,
    mention in README; a scheduled ping can be added if needed.
  - Supabase's built-in email sender is heavily rate-limited and restricted, so
    email confirmation and magic links are off for MVP (see Auth).
- No Bible text stored or shown, except short verses **users type themselves** in posts.

## Approaches considered

1. **Next.js + Supabase (chosen).** Next.js (App Router, TypeScript) for UI and
   server-side logic; Supabase for Postgres, Auth, and row-level security (RLS).
   Deploy to Vercel. *Trade-offs:* fastest path to a secure, deployed app; access
   rules live in the database where they can't be bypassed; very common stack, so
   readable to recruiters. Less "hand-built backend" on show, offset by SQL
   migrations, RLS policies, and tested business logic.
2. **Separate Node/Express API + Neon Postgres + own auth.** *Trade-offs:* shows a
   classic backend, but doubles the hosting pieces and means hand-rolling auth and
   session security — more risk, more time, no user-facing benefit.
3. **SvelteKit + Supabase.** Equivalent to (1) technically; smaller ecosystem and
   less familiar to most recruiters.

The owner handed over the "how"; approach 1 is the builder's pick.

## Product design

### Daily loop
1. Home shows **today's chapter** (e.g. "Psalm 23") with a nudge: "Grab your Bible."
2. User taps **"I read it"** → creates today's check-in.
3. After check-in, prompt: **"What stood out?"** — optional post with:
   - reflection text (optional, up to ~1,000 chars),
   - a verse the user types themselves: reference (e.g. "Psalm 23:4") + text
     (optional, up to ~500 chars),
   - destinations: any of the user's groups and/or the global thread (multi-select).
   A post must have a reflection or a verse (a bare check-in doesn't need a post).
4. Home also shows streak status and the global thread for today.

"Today" is the user's local date (profile timezone). The chapter of the day is looked
up by that date.

### Reading schedule
- Table of `date → reference` (book, chapter). Same for everyone.
- Seeded with a sensible plan starting at launch (builder's call: e.g. Gospel of John,
  then Psalms, etc. — enough for at least a year).
- Managed by **site admins** via a simple admin page (add/edit upcoming days). If a
  date has no entry, show "No reading scheduled today" (and site admins see a warning).
- Users can check in only for **today** (no back-filling) — keeps streaks honest.

### Weekly streaks
- User sets a **weekly goal** of 1–7 readings (default 3) in settings.
- Weeks run **Monday–Sunday** in the user's timezone.
- A week **counts** when check-ins in that week ≥ the goal in effect for that week.
- **Streak** = number of consecutive counted weeks ending with the most recent
  completed week; the current week is added once its goal is met. A current week
  that is still in progress and not yet met does not break the streak.
- Changing the goal applies from the **current week** onward; past weeks keep the goal
  they had (store goal history).
- Show: current streak, best streak, this week's progress (e.g. "2 / 3 this week").

### Groups
- Anyone can create a group: name, description, rules text, **visibility**
  (public/private), optional **denomination tag** from a fixed Protestant list:
  Anglican/Episcopal, Baptist, Lutheran, Methodist, Presbyterian/Reformed,
  Pentecostal/Charismatic, Non-denominational, Other Protestant.
- **Public groups**: discoverable in a group directory (search by name, filter by
  denomination); anyone can join and then post/comment. Non-members can read public
  groups.
- **Private groups**: not listed; joined only via **invite link** created by
  owner/admins; content visible to members only.
- **Roles**: owner (creator; one per group), admins (appointed by owner), members.
  Owner can transfer ownership; owner cannot leave without transferring.
- Group page shows its **rules** at the top and above the comment box.

### Posts, comments, reactions
- **Two kinds of post (owner decided):**
  - **Reading post** — made after today's check-in, tagged with that day's chapter
    and date; can go to groups and/or the global thread.
  - **General post** — prayer requests, questions, discussion; **groups only**, any
    time, no check-in needed, no chapter tag (optional title + body).
  Group pages show one feed of both kinds, newest first, with reading posts labelled
  by chapter. The global thread holds reading posts only.
- A post sent to multiple destinations is stored as **one post per destination**, so
  each group's comments stay inside that group (privacy-correct).
- Comments: flat list under a post (no nested threads in MVP), up to ~1,000 chars.
- Reactions: a single "🙏" reaction per user per post (toggle). Builder may add 1–2
  more if cheap.
- Authors can edit/delete their own posts and comments.

### Global thread
- One per day, tied to the chapter of the day. Implemented as posts with no group
  (destination = global). Anyone signed in can post and comment.
- Moderated by **site admins**.
- *(Builder's call)* New posts in a day's global thread are only allowed on that day;
  comments and reactions stay open afterwards. Past days are browsable as an archive.

### Moderation and safety
- **Report** any post or comment (reason: spam, harassment, inappropriate, other +
  optional note). Reports go to that group's owner/admins, or to site admins for the
  global thread. A moderation queue page lists open reports.
- Moderator actions: **remove** post/comment (soft delete, shows "removed by a
  moderator"), **warn** user (message shown to the user), **mute** in the group for a
  set time (1 day / 7 days), **ban** from the group. Site admins can do the same for the
  global thread (mute/ban from global thread).
- **Block**: any user can block another; blocked users' posts and comments are hidden
  from the blocker everywhere.
- **Slow mode for newcomers**: in their first 48 hours in a group (or first 48 hours of
  account age for the global thread), a user may post at most 3 posts and 10 comments
  per hour in that space.
- Every moderation action is logged (who, what, when, reason).
- *(Builder's call)* **Warnings** are delivered through a `notices` table and shown as a
  banner the user must acknowledge on next visit.
- *(Builder's call)* **Moderation records outlive account deletion**: reports,
  moderation actions and bans keep the row with the user reference set to null (plus a
  stored username snapshot), so deleting an account cannot erase a ban history.
- Private groups use the same tools; they are just less likely to need them.
- **Site admin powers (owner decided):** in **public groups** site admins can see
  reports, remove posts/comments, warn/mute/ban users, and delete the whole group. Site
  admins have **no access to private groups** — they are treated exactly like
  non-members, and RLS tests must prove it.

### Accounts and auth
- Supabase Auth, **email + password**. Passwords are never stored by the app.
- Email confirmation **off** for MVP (Supabase's built-in email is restricted). Builder
  documents how to turn on confirmation/magic links with a free SMTP provider later.
- Profile: display name, unique username, optional denomination, weekly goal,
  timezone (auto-detected at sign-up, editable).
- Must be 13+ (checkbox at sign-up); simple privacy note page.
- Delete account: removes profile and cascades the user's content.
- **Site admin** is a flag on the profile, set manually in the database for the owner.
- **Signed-out visitors (owner decided):** everything requires sign-in. The landing
  page explains the app and has a **"Try the demo"** button that signs into a shared
  demo account with seeded sample data (a demo public group, posts, a streak).
  *(Builder's call)* The demo account is **read-only** (cannot post, comment, react,
  report, create groups or change settings) so visitors can't vandalise it.

### UI
- Clean, calm, readable; mobile-first responsive; light and dark mode.
- Main navigation: **Today** (chapter, check-in, streak, global thread), **Groups**,
  **Profile/Settings**. Moderation queue appears for admins.
- Visual style is the builder's call within "calm and reverent, not gamey."

## Technical design (decided)

- **Next.js** (App Router, TypeScript), **Tailwind CSS**, `@supabase/ssr` for auth in
  server components / server actions.
- **Supabase**: Postgres schema managed as SQL migration files in the repo; **RLS on
  every table**; access rules enforced in the database (not only in UI).
- Rate limits / slow mode and "check in only for today" enforced server-side (database
  functions/triggers or server actions with DB checks).
- Streak calculation as a pure, unit-tested function (week boundaries, timezones,
  goal history, in-progress week).
- **Tests**: unit tests for streak logic and validation; RLS tests proving private
  group content is hidden from non-members and banned/muted users cannot post.
- **Deploy**: Vercel Hobby + Supabase Free. README with setup, env vars, and
  architecture notes (portfolio-facing).

## Data model (outline; builder finalizes columns and indexes)

- `profiles` (id = auth user id, username, display_name, denomination, timezone,
  weekly_goal, is_site_admin, created_at)
- `goal_history` (user_id, goal, effective_week_start)
- `reading_schedule` (date PK, book, chapter, reference label)
- `check_ins` (user_id, local_date, created_at; unique per user per date)
- `groups` (id, name, slug, description, rules, visibility, denomination, owner_id,
  created_at)
- `group_members` (group_id, user_id, role, joined_at, muted_until, banned)
- `group_invites` (id, group_id, code, created_by, expires_at, revoked)
- `posts` (id, kind reading|general, author_id, group_id NULL = global, reading_date
  and reference (reading posts only), title (general only), reflection/body,
  verse_ref, verse_text, created_at, edited_at, removed_at, removed_by)
- `notices` (id, user_id, kind e.g. warning, message, created_at, acknowledged_at)
- `comments` (id, post_id, author_id, body, created_at, edited_at, removed_at,
  removed_by)
- `reactions` (post_id, user_id, kind; PK on all three)
- `reports` (id, reporter_id, post_id or comment_id, reason, note, status, created_at,
  resolved_by, resolved_at)
- `blocks` (blocker_id, blocked_id)
- `moderation_actions` (id, scope group_id or global, target_user_id, action, reason,
  actor_id, created_at, expires_at)
- `global_restrictions` (user_id, muted_until, banned) for the global thread

## What the owner needs to do

- Create a free **Supabase** project (or allow the builder to create it) and provide
  the project URL and publishable (anon) key — never the service-role key in chat.
- Create a free **Vercel** account and connect the GitHub repo for deployment.
- Choose a permanent folder for the project (currently in a temporary session folder).

## Left to the builder

- Exact visual design, component library choice (e.g. shadcn/ui), icons.
- Seed reading plan contents.
- Column types, indexes, constraint names, migration layout.
- Pagination style (infinite scroll vs pages).
- Whether to add 1–2 extra reaction kinds.
- Error/empty states copy.
