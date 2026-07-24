import { describe, it, expect } from "vitest";
import { isQuestionVisible, matchesComparator, findBrokenLogicRules } from "@/lib/formLogic";
import type { FormLogicRule } from "@/types/hrModules";

const rule = (patch: Partial<FormLogicRule>): FormLogicRule => ({
  id: 1,
  formId: 1,
  targetQuestionId: 2,
  sourceQuestionId: 1,
  comparator: "equals",
  comparisonValue: "Yes",
  action: "show",
  combinator: "all",
  orderIndex: 0,
  ...patch,
});

describe("matchesComparator", () => {
  it("equals matches scalar and array (multi-select) answers", () => {
    expect(matchesComparator("equals", "Yes", "Yes")).toBe(true);
    expect(matchesComparator("equals", "No", "Yes")).toBe(false);
    expect(matchesComparator("equals", ["Yes", "Maybe"], "Yes")).toBe(true);
  });

  it("not_equals inverts equals", () => {
    expect(matchesComparator("not_equals", "No", "Yes")).toBe(true);
    expect(matchesComparator("not_equals", "Yes", "Yes")).toBe(false);
  });

  it("contains does a case-insensitive substring match", () => {
    expect(matchesComparator("contains", "Hello World", "world")).toBe(true);
    expect(matchesComparator("contains", "Hello World", "xyz")).toBe(false);
  });

  it("greater_than / less_than compare numerically", () => {
    expect(matchesComparator("greater_than", 5, 3)).toBe(true);
    expect(matchesComparator("greater_than", 2, 3)).toBe(false);
    expect(matchesComparator("less_than", 2, 3)).toBe(true);
  });

  it("is_empty / is_not_empty handle null, blank strings and empty arrays", () => {
    expect(matchesComparator("is_empty", undefined, null)).toBe(true);
    expect(matchesComparator("is_empty", "", null)).toBe(true);
    expect(matchesComparator("is_empty", [], null)).toBe(true);
    expect(matchesComparator("is_empty", "x", null)).toBe(false);

    expect(matchesComparator("is_not_empty", "x", null)).toBe(true);
    expect(matchesComparator("is_not_empty", "", null)).toBe(false);
  });
});

describe("isQuestionVisible", () => {
  it("is visible when no rules target the question", () => {
    expect(isQuestionVisible(99, [], {})).toBe(true);
  });

  it("show rule: visible only when the source answer matches", () => {
    const rules = [rule({ action: "show" })];
    expect(isQuestionVisible(2, rules, { 1: "Yes" })).toBe(true);
    expect(isQuestionVisible(2, rules, { 1: "No" })).toBe(false);
  });

  it("hide rule: inverts the match result", () => {
    const rules = [rule({ action: "hide" })];
    expect(isQuestionVisible(2, rules, { 1: "Yes" })).toBe(false);
    expect(isQuestionVisible(2, rules, { 1: "No" })).toBe(true);
  });

  it("combinator 'all' requires every targeting rule to pass", () => {
    const rules = [
      rule({ id: 1, sourceQuestionId: 1, comparator: "equals", comparisonValue: "Yes", combinator: "all" }),
      rule({ id: 2, sourceQuestionId: 3, comparator: "equals", comparisonValue: "A", combinator: "all" }),
    ];
    expect(isQuestionVisible(2, rules, { 1: "Yes", 3: "A" })).toBe(true);
    expect(isQuestionVisible(2, rules, { 1: "Yes", 3: "B" })).toBe(false);
  });

  it("combinator 'any' wins when present on at least one rule targeting the question", () => {
    const rules = [
      rule({ id: 1, sourceQuestionId: 1, comparator: "equals", comparisonValue: "Yes", combinator: "any" }),
      rule({ id: 2, sourceQuestionId: 3, comparator: "equals", comparisonValue: "A", combinator: "all" }),
    ];
    // Only the first condition matches, but since one rule targeting this question is 'any',
    // a single passing result is enough.
    expect(isQuestionVisible(2, rules, { 1: "Yes", 3: "B" })).toBe(true);
    expect(isQuestionVisible(2, rules, { 1: "No", 3: "B" })).toBe(false);
  });
});

describe("findBrokenLogicRules", () => {
  it("flags rules whose target or source question id no longer exists", () => {
    const rules = [
      rule({ id: 1, targetQuestionId: 2, sourceQuestionId: 1 }),
      rule({ id: 2, targetQuestionId: 5, sourceQuestionId: 1 }),
      rule({ id: 3, targetQuestionId: 2, sourceQuestionId: 9 }),
    ];
    const broken = findBrokenLogicRules(rules, new Set([1, 2]));
    expect(broken.map((r) => r.id)).toEqual([2, 3]);
  });
});
