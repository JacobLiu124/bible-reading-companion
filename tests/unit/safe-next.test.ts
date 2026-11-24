import { expect, test } from "vitest";
import { safeNext } from "@/lib/safe-next";

test("keeps same-site paths", () => {
  expect(safeNext("/groups/abc?x=1")).toBe("/groups/abc?x=1");
  expect(safeNext("/invite/Ab_9")).toBe("/invite/Ab_9");
});

test("rejects off-site and odd targets", () => {
  const backslash = String.fromCharCode(92);
  const bad = [
    "//evil.com",
    "/" + backslash + "evil.com", // browsers read "/\evil.com" as "//evil.com"
    backslash + backslash + "evil.com",
    "/%5Cevil.com",
    "https://evil.com",
    "/%0d%0aevil",
    "javascript:alert(1)",
    "",
    null,
  ];
  for (const b of bad) expect(safeNext(b)).toBe("/today");
});
