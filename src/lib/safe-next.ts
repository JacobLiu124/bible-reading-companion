const FALLBACK = "/today";

/** Only allow same-site relative paths as a post-sign-in redirect target. */
export function safeNext(next: unknown): string {
  const n = typeof next === "string" ? next : "";
  // Must start with exactly one "/". Browsers treat "\" like "/", so "/\evil.com" is off-site.
  if (!n.startsWith("/") || n.startsWith("//") || n.includes("\\")) return FALLBACK;
  // No control characters, raw or percent-encoded (e.g. %0d%0a), and no encoded backslash.
  if (/[\u0000-\u001f]/.test(n) || /%(0[0-9a-f]|1[0-9a-f]|5c)/i.test(n)) return FALLBACK;
  try {
    const url = new URL(n, "http://lamp.invalid");
    return url.origin === "http://lamp.invalid" ? url.pathname + url.search : FALLBACK;
  } catch {
    return FALLBACK;
  }
}
