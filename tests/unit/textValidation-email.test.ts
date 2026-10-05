import { describe, it, expect } from "vitest";
import { EMAIL_PATTERN } from "@/lib/validation/textValidation";

describe("EMAIL_PATTERN", () => {
  it.each([
    "abc123@gmail.com",
    "abc.123@gmail.com",
    "first.last@sub.example.co.uk",
    "a+tag@x.com",
    "a_b-c@my-domain.org",
    "a@b.co",
  ])("accepts %s", (email) => {
    expect(EMAIL_PATTERN.test(email)).toBe(true);
  });

  it.each([
    ["a dot right before the @", "abc123.@gmail.com"],
    ["a leading dot", ".abc@gmail.com"],
    ["consecutive dots in the local part", "abc..123@gmail.com"],
    ["consecutive dots in the domain", "abc123@gmail..com"],
    ["a leading dot in the domain", "abc123@.gmail.com"],
    ["a trailing dot in the domain", "abc123@gmail.com."],
    ["no dot in the domain", "abc123@gmail"],
    ["no @", "abc123gmail.com"],
    ["two @", "a@b@gmail.com"],
    ["spaces", "abc 123@gmail.com"],
    ["an empty local part", "@gmail.com"],
    ["an empty string", ""],
  ])("rejects %s (%s)", (_why, email) => {
    expect(EMAIL_PATTERN.test(email)).toBe(false);
  });

  it("does not backtrack catastrophically on a long non-matching input", () => {
    const start = Date.now();
    EMAIL_PATTERN.test(`${"a.".repeat(5000)}@${"b.".repeat(5000)}`);
    expect(Date.now() - start).toBeLessThan(500);
  });
});
