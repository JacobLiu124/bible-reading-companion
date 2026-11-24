# 0002: Enforce access rules in the database

- Status: Accepted
- Date: 2026-11-23

## Context

The browser talks to Supabase with a public (publishable) key, so anything enforced only in the UI can be bypassed with a direct API call. OneJoy has real privacy rules: private groups, bans, mutes, blocking, a read-only demo account and removed content.

## Decision

- Every table has **row-level security**.
- Clients **never read or write the base tables** for posts, comments and reactions. Reads go through views (`feed_posts`, `feed_comments`) that filter by the caller, hide removed text from non-moderators and drop blocked authors. Writes go through `security definer` RPCs that check membership, mutes, bans, slow mode, the date and the demo flag.
- Functions are **deny-by-default**: only an allow-list of RPCs and caller-only helpers is executable by clients.
- RPCs raise short error codes (`slow_mode`, `not_checked_in`, …) that the UI maps to friendly messages.
- Every rule is covered by a **pgTAP test**.

## Consequences

- Rules can't be bypassed by calling the API directly, and they're testable in isolation.
- More logic lives in SQL, which is less familiar to some developers.
- New functions must be granted explicitly, or the app can't call them.
