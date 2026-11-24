import { z } from "zod";
import { DENOMINATION_VALUES } from "./denominations";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));

export const signUpSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(8, "Use at least 8 characters."),
  username: z.string().trim().toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/, "3–24 letters, numbers or underscores."),
  displayName: z.string().trim().min(1, "Enter your name.").max(40),
  ageConfirmed: z.literal("on", { message: "You must be 13 or older." }),
  timezone: z.string().min(1).default("UTC"),
});

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

export const readingPostSchema = z
  .object({
    body: optionalText(1000),
    verseRef: optionalText(60),
    verseText: optionalText(500),
  })
  .refine((v) => v.body || v.verseText, {
    message: "Write a reflection or add a scripture that stood out.",
  });

export const generalPostSchema = z.object({
  title: optionalText(120),
  body: z.string().trim().min(1, "Write something first.").max(1000),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1, "Write a comment first.").max(1000),
});

export const groupSchema = z.object({
  name: z.string().trim().min(3, "At least 3 characters.").max(60),
  description: z.string().trim().max(500).default(""),
  rules: z.string().trim().max(2000).default(""),
  visibility: z.enum(["public", "private"]),
  denomination: z.enum(DENOMINATION_VALUES).optional()
    .or(z.literal("").transform(() => undefined)),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  denomination: z.enum(DENOMINATION_VALUES).optional()
    .or(z.literal("").transform(() => undefined)),
  timezone: z.string().min(1),
  weeklyGoal: z.coerce.number().int().min(1).max(7),
});

/** First error message from a failed parse, for showing next to a form. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the form.";
}
