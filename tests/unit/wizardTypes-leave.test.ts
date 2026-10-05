import { describe, it, expect } from "vitest";
import { calculateLeaveEntitlement } from "@/components/modals/employee-wizard/wizardTypes";

describe("calculateLeaveEntitlement", () => {
  it("returns null without a hire date", () => {
    expect(calculateLeaveEntitlement("")).toBeNull();
  });

  // Casual leave accrues 0.5/month starting with the joining month, so the
  // number of months is 12 - (0-based hire month), whatever the day of month.
  it.each([
    ["2026-01-01", 12],
    ["2026-01-31", 12],
    ["2026-06-15", 7],
    ["2026-10-01", 3],
    ["2026-10-05", 3],
    ["2026-10-31", 3],
    ["2026-12-01", 1],
    ["2026-12-31", 1],
  ])("hired %s -> %i casual-leave months in the joining year", (hireDate, months) => {
    const info = calculateLeaveEntitlement(hireDate)!;
    expect(info.firstYearCasualMonths).toBe(months);
    expect(info.remainingMonths).toBe(months);
  });

  it("grants no annual leave in the joining year and a quarter-based amount afterwards", () => {
    expect(calculateLeaveEntitlement("2026-10-05")).toMatchObject({
      firstYear: 0,
      secondYearOnwards: 4,
      quarter: "Q4 (Oct-Dec)",
    });
    expect(calculateLeaveEntitlement("2026-02-10")).toMatchObject({ secondYearOnwards: 14 });
    expect(calculateLeaveEntitlement("2026-05-10")).toMatchObject({ secondYearOnwards: 10 });
    expect(calculateLeaveEntitlement("2026-08-10")).toMatchObject({ secondYearOnwards: 7 });
  });
});
