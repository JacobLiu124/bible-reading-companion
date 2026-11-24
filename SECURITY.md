# Security policy

## Reporting a vulnerability

Please **don't open a public issue** for security problems. Report them privately through
[GitHub's private vulnerability reporting](https://github.com/JacobLiu124/bible-reading-companion/security/advisories/new).

Include what you found, how to reproduce it, and what someone could do with it. You'll get a reply within a week.

## Scope

Especially welcome:

- Ways to read private-group content without being a member
- Ways to bypass moderation (mutes, bans) or the read-only demo account
- Ways to act as another user

## How the app protects data

- All access rules are enforced in Postgres with row-level security and security-definer functions, not only in the UI.
- Internal database helpers can't be called by clients; only an allow-list of RPCs can.
- Passwords are handled by Supabase Auth and never stored by OneJoy.
- The Supabase secret key is used only by a local seeding script and never reaches the browser or the hosted app.
