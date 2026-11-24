# 0004: Weekly streaks instead of daily

- Status: Accepted
- Date: 2026-11-23

## Context

Daily streaks build habits, but research on streak design suggests breaking a long streak makes people more likely to quit entirely. Users also read on different rhythms.

## Decision

Each user sets a **weekly goal** of 1–7 readings. A Monday–Sunday week (in the user's own timezone) counts when the goal is met, and the streak is the number of consecutive weeks met. Goal changes apply from the current week; past weeks keep the goal they had. Streak maths is a pure, unit-tested function (`src/lib/streak.ts`).

## Consequences

- Missing a day doesn't break the habit; the streak is forgiving by design.
- Check-ins are on trust, since nobody can verify reading a paper Bible.
- Changing timezone can occasionally allow an extra check-in in one real day (tracked as a known minor issue).
