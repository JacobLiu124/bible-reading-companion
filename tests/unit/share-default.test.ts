import { expect, test } from "vitest";
import { defaultShareDestination } from "@/lib/share";

test("picks the group you share to most", () => {
  expect(defaultShareDestination(["a", "b", "b", null, "b", "a"], ["a", "b"])).toBe("b");
});

test("ignores groups you've left", () => {
  expect(defaultShareDestination(["old", "old", "a"], ["a"])).toBe("a");
});

test("falls back to your first group, then to the global thread", () => {
  expect(defaultShareDestination([], ["a", "b"])).toBe("a");
  expect(defaultShareDestination(["x"], [])).toBe("global");
});
