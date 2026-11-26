import { describe, expect, test } from "vitest";
import { passwordStrength } from "@/lib/password";

describe("passwordStrength", () => {
  test("nothing typed shows no meter", () => {
    expect(passwordStrength("")).toBeNull();
  });
  test("under 8 characters is weak (red)", () => {
    expect(passwordStrength("abc123")).toEqual({
      level: "weak",
      label: "Too short: use at least 8 characters",
    });
  });
  test("common passwords are weak even when long enough", () => {
    expect(passwordStrength("password")?.level).toBe("weak");
    expect(passwordStrength("12345678")?.level).toBe("weak");
    expect(passwordStrength("Password1")?.level).toBe("weak");
  });
  test("8+ characters of one or two kinds is okay (yellow)", () => {
    expect(passwordStrength("sunriseday")).toEqual({
      level: "fair",
      label: "Okay: longer, or mix in numbers and symbols",
    });
    expect(passwordStrength("john3sixteen")?.level).toBe("fair");
  });
  test("10+ characters mixing three kinds is strong (green)", () => {
    expect(passwordStrength("Grace4Every1")).toEqual({ level: "strong", label: "Strong" });
  });
  test("a long passphrase is strong", () => {
    expect(passwordStrength("still waters restore my soul")?.level).toBe("strong");
  });
});
