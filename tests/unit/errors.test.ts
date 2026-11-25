import { expect, test } from "vitest";
import { ERROR_CODES, friendlyError } from "@/lib/errors";

test("every database error code has a friendly message", () => {
  for (const code of ERROR_CODES) {
    const msg = friendlyError({ message: code });
    expect(msg).not.toBe("Something went wrong. Please try again.");
    expect(msg.length).toBeGreaterThan(5);
  }
});

test("covers the codes the database raises", () => {
  expect(ERROR_CODES).toEqual(
    expect.arrayContaining([
      "not_checked_in",
      "not_today",
      "no_reading_today",
      "muted",
      "banned",
      "slow_mode",
      "demo_read_only",
      "global_reading_only",
      "not_member",
      "forbidden",
      "owner_must_transfer",
      "invalid_invite",
      "no_destination",
      "invalid_duration",
      "invalid_goal",
      "undo_expired",
    ]),
  );
});

test("unknown errors get a generic message", () => {
  expect(friendlyError(new Error("boom"))).toBe("Something went wrong. Please try again.");
  expect(friendlyError(null)).toBe("Something went wrong. Please try again.");
});
