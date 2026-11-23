import { describe, expect, test } from "vitest";
import {
  commentSchema, generalPostSchema, groupSchema, readingPostSchema, signUpSchema,
} from "@/lib/validation";

const goodSignUp = {
  email: "ann@example.com", password: "longenough", username: "ann_1",
  displayName: "Ann", ageConfirmed: "on", timezone: "Europe/London",
};

describe("signUpSchema", () => {
  test("accepts a valid sign-up and lowercases the username", () => {
    const r = signUpSchema.safeParse({ ...goodSignUp, username: "Ann_1" });
    expect(r.success).toBe(true);
    expect(r.data?.username).toBe("ann_1");
  });
  test("rejects a too-short username", () => {
    expect(signUpSchema.safeParse({ ...goodSignUp, username: "ab" }).success).toBe(false);
  });
  test("requires the 13+ checkbox", () => {
    expect(signUpSchema.safeParse({ ...goodSignUp, ageConfirmed: undefined }).success).toBe(false);
  });
  test("requires an 8+ character password", () => {
    expect(signUpSchema.safeParse({ ...goodSignUp, password: "short" }).success).toBe(false);
  });
});

describe("post and comment limits", () => {
  test("reading post needs a reflection or a verse", () => {
    expect(readingPostSchema.safeParse({ body: "", verseRef: "", verseText: "" }).success).toBe(false);
    expect(readingPostSchema.safeParse({ body: "", verseRef: "Ps 23:1", verseText: "The Lord" }).success).toBe(true);
  });
  test("reflection over 1000 characters is rejected", () => {
    expect(readingPostSchema.safeParse({ body: "a".repeat(1001) }).success).toBe(false);
  });
  test("verse text over 500 characters is rejected", () => {
    expect(readingPostSchema.safeParse({ verseText: "a".repeat(501) }).success).toBe(false);
  });
  test("general post needs a body", () => {
    expect(generalPostSchema.safeParse({ title: "Hi", body: "  " }).success).toBe(false);
  });
  test("comment length 1..1000", () => {
    expect(commentSchema.safeParse({ body: "" }).success).toBe(false);
    expect(commentSchema.safeParse({ body: "a".repeat(1001) }).success).toBe(false);
    expect(commentSchema.safeParse({ body: "amen" }).success).toBe(true);
  });
  test("group name 3..60 and a known denomination", () => {
    expect(groupSchema.safeParse({ name: "ab", visibility: "public" }).success).toBe(false);
    expect(groupSchema.safeParse({ name: "Grace", visibility: "public", denomination: "catholic" }).success).toBe(false);
    expect(groupSchema.safeParse({ name: "Grace", visibility: "private", denomination: "baptist" }).success).toBe(true);
  });
});
