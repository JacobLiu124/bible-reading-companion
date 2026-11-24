# 0001: Next.js and Supabase on free tiers

- Status: Accepted
- Date: 2026-11-23

## Context

OneJoy is a portfolio project that real friends will use. It needs auth, a relational database with strict access rules, and a web UI that works well on phones. Running costs must be zero.

## Decision

Use **Next.js** (App Router, TypeScript) for the UI and server actions, hosted on **Vercel Hobby**, and **Supabase** (Postgres + Auth) on the free tier. Schema changes are SQL migrations in the repo.

## Alternatives considered

- **Separate Node/Express API + Neon Postgres + hand-rolled auth.** Shows a classic backend, but doubles the hosting pieces and means writing session security by hand for no user benefit.
- **SvelteKit + Supabase.** Technically equivalent, but a smaller ecosystem and less familiar to most reviewers.

## Consequences

- Fast path to a secure, deployed app; very common stack.
- Supabase's free tier pauses projects after about a week without activity.
- Next.js 16 with Cache Components means signed-in data must stream inside `<Suspense>` boundaries.
