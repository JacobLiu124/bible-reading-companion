import { describe, expect, test } from "vitest";
import { addDays, localToday, weekStart } from "@/lib/dates";

describe("localToday", () => {
  test("uses the user's timezone, not UTC", () => {
    expect(localToday("Pacific/Auckland", new Date("2026-11-23T11:30:00Z"))).toBe("2026-11-24");
    expect(localToday("America/Los_Angeles", new Date("2026-11-23T05:00:00Z"))).toBe("2026-11-22");
  });
  test("falls back to UTC for an unknown timezone", () => {
    expect(localToday("Not/AZone", new Date("2026-11-23T11:30:00Z"))).toBe("2026-11-23");
  });
});

describe("weekStart", () => {
  test("Sunday belongs to the week that started the previous Monday", () => {
    expect(weekStart("2026-11-29")).toBe("2026-11-23");
  });
  test("Monday starts a new week", () => {
    expect(weekStart("2026-11-30")).toBe("2026-11-30");
  });
});

test("addDays crosses month boundaries", () => {
  expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
  expect(addDays("2026-12-01", -7)).toBe("2026-11-24");
});
