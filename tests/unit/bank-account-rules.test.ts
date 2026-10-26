import { describe, expect, it } from "vitest";
import { getBankAccountRule, validateAccountNumberForBank } from "@/lib/validation/bankAccountRules";

describe("getBankAccountRule", () => {
  it("prefers the longest alias (Commercial Bank of Ceylon is not Bank of Ceylon)", () => {
    expect(getBankAccountRule("Commercial Bank of Ceylon")?.bank).toBe("Commercial Bank of Ceylon");
    expect(getBankAccountRule("Bank of Ceylon")?.bank).toBe("Bank of Ceylon");
  });
  it("matches abbreviations and punctuation variants", () => {
    expect(getBankAccountRule("HNB")?.bank).toBe("Hatton National Bank");
    expect(getBankAccountRule("People's Bank")?.lengths).toEqual([15]);
  });
  it("returns null for unknown or empty banks", () => {
    expect(getBankAccountRule("Some Credit Union")).toBeNull();
    expect(getBankAccountRule("")).toBeNull();
  });
});

describe("validateAccountNumberForBank", () => {
  it("treats empty as valid (required-ness is enforced elsewhere)", () => {
    expect(validateAccountNumberForBank("", "Sampath Bank")).toBe(true);
  });
  it.each([
    ["Bank of Ceylon", "1234567890"],
    ["Sampath Bank", "123456789012"],
    ["Amana Bank", "1234567890123"],
    ["State Bank of India", "12345678901234"],
    ["Seylan Bank", "123456789012345"],
    ["Union Bank", "1234567890123456"],
    ["CDB", "123456789012345678"],
  ])("accepts a correct-length number for %s", (bank, num) => {
    expect(validateAccountNumberForBank(num, bank)).toBe(true);
  });
  it("rejects wrong lengths", () => {
    expect(validateAccountNumberForBank("123456789", "Bank of Ceylon")).not.toBe(true);
    expect(validateAccountNumberForBank("12345678901", "Bank of Ceylon")).not.toBe(true);
  });
  it("rejects non-numeric input", () => {
    expect(validateAccountNumberForBank("12345ABC90", "Bank of Ceylon")).not.toBe(true);
    expect(validateAccountNumberForBank("1234-567-890", "Bank of Ceylon")).not.toBe(true);
    expect(validateAccountNumberForBank("1234 567890", "Bank of Ceylon")).not.toBe(true);
  });
  it("enforces Standard Chartered prefixes per length", () => {
    expect(validateAccountNumberForBank("18123456789", "Standard Chartered Bank")).toBe(true);
    expect(validateAccountNumberForBank("01123456789", "Standard Chartered Bank")).toBe(true);
    expect(validateAccountNumberForBank("88123456789", "Standard Chartered Bank")).not.toBe(true);
    expect(validateAccountNumberForBank("881234567890", "Standard Chartered Bank")).toBe(true);
    expect(validateAccountNumberForBank("181234567890", "Standard Chartered Bank")).not.toBe(true);
  });
  it("falls back to 6-20 digits for unknown banks", () => {
    expect(validateAccountNumberForBank("123456", "Other Bank")).toBe(true);
    expect(validateAccountNumberForBank("12345", "Other Bank")).not.toBe(true);
    expect(validateAccountNumberForBank("123456789012345678901", undefined)).not.toBe(true);
  });
});
