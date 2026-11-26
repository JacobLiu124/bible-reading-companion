/** The parts of a Supabase AuthError we read. `code` is set by current servers; `message` is the fallback. */
export type AuthErrorLike = { code?: string; message?: string };

const has = (e: AuthErrorLike, code: string, pattern: RegExp) =>
  e.code === code || pattern.test(e.message ?? "");

/** Friendly copy for a failed sign-up. Never shows raw server text. */
export function signUpErrorMessage(error: AuthErrorLike): string {
  // Supabase's built-in mailer only sends a few emails an hour. Hitting the limit usually means the
  // same address has already been tried, so point people at their inbox or the sign-in page.
  if (has(error, "over_email_send_rate_limit", /email rate limit/i)) {
    return "An account with this email may already exist, or it's waiting for you to confirm your email address. Check your inbox, or try signing in.";
  }
  if (has(error, "user_already_exists", /already registered/i)) {
    return "That email already has an account. Try signing in.";
  }
  if (has(error, "weak_password", /password should/i)) return "Choose a stronger password.";
  if (has(error, "over_request_rate_limit", /request rate limit/i)) {
    return "Too many attempts. Wait a minute and try again.";
  }
  return "We couldn't create your account just now. Please try again.";
}

/** Friendly copy for a failed sign-in. Wrong email and wrong password stay indistinguishable. */
export function signInErrorMessage(error: AuthErrorLike): string {
  if (has(error, "email_not_confirmed", /email not confirmed/i)) {
    return "Confirm your email address first. Check your inbox for the link we sent.";
  }
  if (has(error, "over_request_rate_limit", /request rate limit/i)) {
    return "Too many attempts. Wait a minute and try again.";
  }
  return "Email or password is incorrect.";
}
