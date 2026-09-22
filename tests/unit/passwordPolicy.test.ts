import { describe, it, expect } from "vitest";
import {
  evaluatePasswordPolicy,
  isPasswordPolicyCompliant,
  getPasswordStrength,
  PASSWORD_MIN_LENGTH,
} from "@/lib/validation/passwordPolicy";

describe("evaluatePasswordPolicy", () => {
  it("rejects passwords shorter than the minimum length", () => {
    expect(evaluatePasswordPolicy("Ab1!").rules.find((r) => r.id === "minLength")?.passed).toBe(false);
  });

  it("requires uppercase, lowercase, digit and special character", () => {
    expect(evaluatePasswordPolicy("lowercase1!").rules.find((r) => r.id === "uppercase")?.passed).toBe(false);
    expect(evaluatePasswordPolicy("UPPERCASE1!").rules.find((r) => r.id === "lowercase")?.passed).toBe(false);
    expect(evaluatePasswordPolicy("NoDigitsHere!").rules.find((r) => r.id === "digit")?.passed).toBe(false);
    expect(evaluatePasswordPolicy("NoSpecial123").rules.find((r) => r.id === "specialChar")?.passed).toBe(false);
  });

  it("rejects the ticket's example weak passwords", () => {
    for (const weak of ["123", "a", "abc", "password"]) {
      expect(isPasswordPolicyCompliant(weak)).toBe(false);
    }
  });

  it("flags a denylisted password as failing the notCommon rule regardless of case", () => {
    const result = evaluatePasswordPolicy("Qwerty123");
    expect(result.rules.find((r) => r.id === "notCommon")?.passed).toBe(false);
  });

  it("accepts a password satisfying every rule", () => {
    const result = evaluatePasswordPolicy("Str0ng!Pass");
    expect(result.isValid).toBe(true);
    expect(result.rules.every((r) => r.passed)).toBe(true);
  });

  it(`accepts a password exactly ${PASSWORD_MIN_LENGTH} characters long`, () => {
    expect(isPasswordPolicyCompliant("Ab1!ab1!")).toBe(true);
  });
});

describe("getPasswordStrength", () => {
  it("is weak whenever the policy isn't fully satisfied", () => {
    expect(getPasswordStrength("weak")).toBe("weak");
    expect(getPasswordStrength("password")).toBe("weak");
  });

  it("is medium once valid but under 12 characters", () => {
    expect(getPasswordStrength("Ab1!ab1!")).toBe("medium");
  });

  it("is strong once valid and 12+ characters", () => {
    expect(getPasswordStrength("Str0ng!Passw0rd")).toBe("strong");
  });
});
