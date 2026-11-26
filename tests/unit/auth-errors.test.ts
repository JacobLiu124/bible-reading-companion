import { describe, expect, test } from "vitest";
import { signInErrorMessage, signUpErrorMessage } from "@/lib/auth-errors";

describe("signUpErrorMessage", () => {
  test("email rate limit explains the likely cause instead of the raw error", () => {
    expect(
      signUpErrorMessage({ code: "over_email_send_rate_limit", message: "email rate limit exceeded" }),
    ).toBe(
      "An account with this email may already exist, or it's waiting for you to confirm your email address. Check your inbox, or try signing in.",
    );
  });
  test("matches on the message when there's no code", () => {
    expect(signUpErrorMessage({ message: "Email rate limit exceeded" })).toMatch(/may already exist/);
  });
  test("existing account", () => {
    expect(signUpErrorMessage({ code: "user_already_exists", message: "User already registered" })).toBe(
      "That email already has an account. Try signing in.",
    );
  });
  test("weak password from the server", () => {
    expect(signUpErrorMessage({ code: "weak_password", message: "Password should be..." })).toBe(
      "Choose a stronger password.",
    );
  });
  test("anything else is a calm generic message, not raw server text", () => {
    expect(signUpErrorMessage({ message: "Database error saving new user" })).toBe(
      "We couldn't create your account just now. Please try again.",
    );
  });
});

describe("signInErrorMessage", () => {
  test("unconfirmed email asks them to confirm", () => {
    expect(signInErrorMessage({ code: "email_not_confirmed", message: "Email not confirmed" })).toBe(
      "Confirm your email address first. Check your inbox for the link we sent.",
    );
  });
  test("too many attempts", () => {
    expect(
      signInErrorMessage({ code: "over_request_rate_limit", message: "Request rate limit reached" }),
    ).toBe("Too many attempts. Wait a minute and try again.");
  });
  test("wrong details stay vague", () => {
    expect(signInErrorMessage({ code: "invalid_credentials", message: "Invalid login credentials" })).toBe(
      "Email or password is incorrect.",
    );
  });
});
