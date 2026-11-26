export type Strength = { level: "weak" | "fair" | "strong"; label: string };

export const MIN_PASSWORD_LENGTH = 8;

// A few of the most-guessed passwords. Not a full breach list, just enough to catch the obvious ones.
const COMMON = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty123",
  "qwertyuiop",
  "iloveyou",
  "letmein1",
  "11111111",
  "00000000",
  "abc12345",
  "football",
  "baseball",
  "sunshine",
  "princess",
  "welcome1",
  "jesus123",
  "onejoy123",
]);

/**
 * A simple guide for the sign-up meter: red under 8 characters or a well-known password, yellow for
 * a plain one, green for 10+ characters mixing three kinds (lower, upper, numbers, symbols) or a long
 * passphrase. Only the 8-character minimum is enforced; the colours are advice.
 */
export function passwordStrength(password: string): Strength | null {
  if (!password) return null;
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { level: "weak", label: `Too short: use at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  if (COMMON.has(password.toLowerCase())) {
    return { level: "weak", label: "Too common: pick something harder to guess" };
  }
  const kinds = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (password.length >= 16 || (password.length >= 10 && kinds >= 3)) {
    return { level: "strong", label: "Strong" };
  }
  return { level: "fair", label: "Okay: longer, or mix in numbers and symbols" };
}
