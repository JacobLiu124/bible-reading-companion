import { describe, expect, test } from "vitest";
import { computeStreak } from "@/lib/streak";

// Week of 2026-11-23 (Mon) .. 2026-11-29 (Sun). "today" is Tue 2026-12-01.
const goal3 = [{ effectiveWeekStart: "2026-01-05", goal: 3 }];

describe("computeStreak", () => {
  test("last week met, nothing yet this week -> streak 1", () => {
    const r = computeStreak({
      checkIns: ["2026-11-23", "2026-11-25", "2026-11-27"],
      goalHistory: goal3,
      today: "2026-12-01",
    });
    expect(r).toEqual({ current: 1, best: 1, thisWeekCount: 0, thisWeekGoal: 3 });
  });

  test("current week counts once its goal is met", () => {
    const r = computeStreak({
      checkIns: ["2026-11-23", "2026-11-25", "2026-11-27", "2026-11-30", "2026-12-01", "2026-11-29"],
      goalHistory: goal3,
      today: "2026-12-01",
    });
    // Sun 29th is last week (4 that week); this week has Mon 30 + Tue 1 = 2 -> not met yet
    expect(r.current).toBe(1);
    expect(r.thisWeekCount).toBe(2);
    const r2 = computeStreak({
      checkIns: ["2026-11-23", "2026-11-25", "2026-11-27", "2026-11-30", "2026-12-01", "2026-12-02"],
      goalHistory: goal3,
      today: "2026-12-02",
    });
    expect(r2.current).toBe(2);
  });

  test("a missed week breaks the streak but best remembers", () => {
    const r = computeStreak({
      checkIns: ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-23", "2026-11-24"],
      goalHistory: goal3,
      today: "2026-12-01",
    });
    expect(r.current).toBe(0);
    expect(r.best).toBe(1);
  });

  test("past weeks use the goal that applied then", () => {
    const r = computeStreak({
      checkIns: ["2026-11-23", "2026-11-24", "2026-11-25"],
      goalHistory: [...goal3, { effectiveWeekStart: "2026-11-30", goal: 5 }],
      today: "2026-12-01",
    });
    expect(r.current).toBe(1);
    expect(r.thisWeekGoal).toBe(5);
  });

  test("empty input", () => {
    expect(computeStreak({ checkIns: [], goalHistory: [], today: "2026-12-01" })).toEqual({
      current: 0, best: 0, thisWeekCount: 0, thisWeekGoal: 3,
    });
  });

  test("long run of met weeks", () => {
    const checkIns: string[] = [];
    for (const mon of ["2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23"]) {
      const d = new Date(mon + "T00:00:00Z");
      for (let i = 0; i < 3; i++) {
        checkIns.push(new Date(d.getTime() + i * 86400000).toISOString().slice(0, 10));
      }
    }
    const r = computeStreak({ checkIns, goalHistory: goal3, today: "2026-11-30" });
    expect(r.current).toBe(4);
    expect(r.best).toBe(4);
  });
});
