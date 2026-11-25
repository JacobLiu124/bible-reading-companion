import { describe, expect, test } from "vitest";
import { weekDays, weekSummary } from "@/lib/week";

// Mon..Sun, today = Thursday (index 3).
const R = true;
const _ = false;

describe("weekDays", () => {
  test("past days are read or missed, today and later are today or upcoming", () => {
    expect(weekDays([R, _, R, _, _, _, _], 3)).toEqual([
      "read",
      "missed",
      "read",
      "today",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
  });
  test("today shows as read once you've checked in", () => {
    expect(weekDays([_, _, _, R, _, _, _], 3)[3]).toBe("read");
  });
});

describe("weekSummary", () => {
  test("says what's left, including missed days, without scolding", () => {
    expect(weekSummary([R, _, R, _, _, _, _], 3, 3, 4)).toBe(
      "2 read, 1 missed. One more by Sunday keeps your streak.",
    );
  });
  test("plural and no streak yet", () => {
    expect(weekSummary([_, _, _, _, _, _, _], 3, 3, 0)).toBe(
      "0 read, 3 missed. 3 more by Sunday meets your goal.",
    );
  });
  test("leaves out 'missed' when nothing was missed", () => {
    expect(weekSummary([R, R, _, _, _, _, _], 2, 3, 1)).toBe("2 read. One more by Sunday keeps your streak.");
  });
  test("goal met", () => {
    expect(weekSummary([R, _, R, R, _, _, _], 3, 3, 2)).toBe("3 read, 1 missed. Goal met this week.");
  });
  test("when the goal is out of reach it looks ahead, not back", () => {
    expect(weekSummary([_, _, _, _, _, _, _], 6, 3, 2)).toBe("0 read, 6 missed. A fresh week starts Monday.");
  });
  test("today counts as still available until it's read", () => {
    expect(weekSummary([R, R, _, _, _, _, _], 6, 3, 0)).toBe(
      "2 read, 4 missed. One more today meets your goal.",
    );
  });
});
