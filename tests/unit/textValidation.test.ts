import { describe, it, expect } from "vitest";
import { containsEmoji, stripEmoji, noEmoji, noFutureDate, onlyFutureDate, localIsoDate } from "@/lib/validation/textValidation";

describe("containsEmoji", () => {
  it("detects the ticket's example mixed-content string", () => {
    expect(containsEmoji("A\u{1F60A}*b#1\u{1F680}c$Z")).toBe(true);
  });

  it("detects emoticons, pictographs, dingbats and flag letters", () => {
    expect(containsEmoji("\u{1F600}")).toBe(true); // grinning face
    expect(containsEmoji("\u{2764}\u{FE0F}")).toBe(true); // heavy black heart + VS16
    expect(containsEmoji("\u{2705}")).toBe(true); // white heavy check mark
    expect(containsEmoji("\u{1F1FA}\u{1F1F8}")).toBe(true); // regional indicators (flag)
  });

  it("does not flag plain ASCII text", () => {
    expect(containsEmoji("John O'Brien-Smith")).toBe(false);
    expect(containsEmoji("Acme Corp. #4, 1st Lane")).toBe(false);
  });

  it("does not flag accented or non-Latin script names", () => {
    expect(containsEmoji("Renée")).toBe(false);
    expect(containsEmoji("කසුන්")).toBe(false);
    expect(containsEmoji("தமிழ்")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(containsEmoji("")).toBe(false);
  });
});

describe("stripEmoji", () => {
  it("removes emoji while preserving the rest of the text", () => {
    expect(stripEmoji("A\u{1F60A}*b#1\u{1F680}c$Z")).toBe("A*b#1c$Z");
  });

  it("removes every emoji in a run, not just the first", () => {
    expect(stripEmoji("\u{1F600}\u{1F680}\u{1F1FA}\u{1F1F8}")).toBe("");
  });

  it("leaves non-emoji text unchanged", () => {
    expect(stripEmoji("John O'Brien-Smith")).toBe("John O'Brien-Smith");
  });
});

describe("noEmoji (react-hook-form validate rule)", () => {
  it("returns an error message when the value contains emoji", () => {
    expect(noEmoji("A\u{1F60A}*b#1\u{1F680}c$Z")).toBe("Emoji characters are not allowed");
  });

  it("returns true for plain text", () => {
    expect(noEmoji("John Smith")).toBe(true);
  });

  it("passes through empty/non-string values so it composes with `required`", () => {
    expect(noEmoji("")).toBe(true);
    expect(noEmoji(undefined)).toBe(true);
    expect(noEmoji(null)).toBe(true);
  });
});

describe("noFutureDate (react-hook-form validate rule, OCD-417)", () => {
  const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

  it("rejects the ticket's example future date", () => {
    expect(noFutureDate("2030-12-31")).toBe("Date cannot be a future date. Please enter a valid date.");
  });

  it("rejects any date after today", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(noFutureDate(toIsoDate(tomorrow))).toBe("Date cannot be a future date. Please enter a valid date.");
  });

  it("accepts today's date", () => {
    expect(noFutureDate(toIsoDate(new Date()))).toBe(true);
  });

  it("accepts a past date", () => {
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    expect(noFutureDate(toIsoDate(lastYear))).toBe(true);
  });

  it("passes through empty/invalid values so it composes with `required`", () => {
    expect(noFutureDate("")).toBe(true);
    expect(noFutureDate("not-a-date")).toBe(true);
  });
});

describe("onlyFutureDate (react-hook-form validate rule)", () => {
  const FUTURE_ONLY_MESSAGE = "Date must be a future date. Please select a date after today.";

  it("rejects today", () => {
    expect(onlyFutureDate(localIsoDate())).toBe(FUTURE_ONLY_MESSAGE);
  });

  it("rejects yesterday and older dates", () => {
    expect(onlyFutureDate(localIsoDate(-1))).toBe(FUTURE_ONLY_MESSAGE);
    expect(onlyFutureDate("2020-01-01")).toBe(FUTURE_ONLY_MESSAGE);
  });

  it("accepts tomorrow and later dates", () => {
    expect(onlyFutureDate(localIsoDate(1))).toBe(true);
    expect(onlyFutureDate("2099-12-31")).toBe(true);
  });

  it("passes through empty/invalid values so it composes with `required`", () => {
    expect(onlyFutureDate("")).toBe(true);
    expect(onlyFutureDate("not-a-date")).toBe(true);
  });
});

describe("localIsoDate", () => {
  it("returns today's local date as YYYY-MM-DD", () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    expect(localIsoDate()).toBe(expected);
  });

  it("offsets by whole days", () => {
    expect(localIsoDate(1) > localIsoDate()).toBe(true);
    expect(localIsoDate(-1) < localIsoDate()).toBe(true);
  });
});
