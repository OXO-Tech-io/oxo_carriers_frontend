import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  findLeaveConflict,
  getLeaveConflictMessage,
  toIsoDay,
  type ExistingLeave,
  type LeaveSelection,
} from "@/lib/leaveConflicts";

const DAY = "2026-10-12";

// The API serializes a DATE column as the instant of its local midnight, so a server in UTC+5:30
// sends 2026-10-23 as "2026-10-22T18:30:00.000Z". Pinning the zone keeps that wire format (and the
// off-by-one it used to cause, OCD-593) reproducible on any machine.
beforeAll(() => {
  vi.stubEnv("TZ", "Asia/Colombo");
});
afterAll(() => {
  vi.unstubAllEnvs();
});

const halfDay = (
  period: "morning" | "evening",
  status = "pending",
  date = DAY,
): ExistingLeave => ({
  start_date: date,
  end_date: date,
  status,
  is_half_day: true,
  half_day_period: period,
});

const fullDay = (startIso = DAY, endIso = DAY, status = "hr_approved"): ExistingLeave => ({
  start_date: startIso,
  end_date: endIso,
  status,
  is_half_day: false,
});

const halfDaySelection = (period: "morning" | "evening" | "" = "", date = DAY): LeaveSelection => ({
  startIso: date,
  endIso: date,
  isHalfDay: true,
  period,
});

const fullDaySelection = (startIso = DAY, endIso = DAY): LeaveSelection => ({
  startIso,
  endIso,
  isHalfDay: false,
  period: "",
});

describe("toIsoDay", () => {
  it("passes a plain YYYY-MM-DD date through untouched", () => {
    expect(toIsoDay("2026-10-23")).toBe("2026-10-23");
  });

  it("reads a serialized DATE as the calendar day it was stored for, not the previous UTC day", () => {
    const wire = new Date(2026, 9, 23).toISOString();
    expect(wire).toBe("2026-10-22T18:30:00.000Z"); // the pinned zone really is UTC+5:30
    expect(toIsoDay(wire)).toBe("2026-10-23");
  });

  it("reads a UTC-midnight timestamp as that day", () => {
    expect(toIsoDay("2026-10-12T00:00:00.000Z")).toBe("2026-10-12");
  });

  it("formats a Date in local time", () => {
    expect(toIsoDay(new Date(2026, 9, 12))).toBe("2026-10-12");
  });
});

describe("findLeaveConflict", () => {
  describe("half-day request", () => {
    it("allows the evening half when the morning half is already booked (OCD-593)", () => {
      expect(findLeaveConflict([halfDay("morning")], halfDaySelection("evening"))).toBeUndefined();
    });

    it("allows the morning half when the evening half is already booked", () => {
      expect(findLeaveConflict([halfDay("evening")], halfDaySelection("morning"))).toBeUndefined();
    });

    it("allows either half for an approved half-day too", () => {
      expect(
        findLeaveConflict([halfDay("morning", "hr_approved")], halfDaySelection("evening")),
      ).toBeUndefined();
      expect(
        findLeaveConflict([halfDay("morning", "team_leader_approved")], halfDaySelection("evening")),
      ).toBeUndefined();
    });

    it("blocks the same half that is already booked", () => {
      const existing = halfDay("morning");
      expect(findLeaveConflict([existing], halfDaySelection("morning"))).toBe(existing);
    });

    it("blocks a date covered by a full-day request, whichever half is asked for", () => {
      const existing = fullDay();
      expect(findLeaveConflict([existing], halfDaySelection("morning"))).toBe(existing);
      expect(findLeaveConflict([existing], halfDaySelection("evening"))).toBe(existing);
      expect(findLeaveConflict([existing], halfDaySelection(""))).toBe(existing);
    });

    it("blocks a date inside a multi-day full-day request", () => {
      const existing = fullDay("2026-10-08", "2026-10-14");
      expect(findLeaveConflict([existing], halfDaySelection("evening"))).toBe(existing);
    });

    it("keeps a date open while no period is chosen if one half is still free", () => {
      expect(findLeaveConflict([halfDay("morning")], halfDaySelection(""))).toBeUndefined();
    });

    it("blocks a date with no period chosen once both halves are booked", () => {
      const morning = halfDay("morning");
      const evening = halfDay("evening", "hr_approved");
      expect(findLeaveConflict([morning, evening], halfDaySelection(""))).toBe(morning);
    });

    it("blocks either period once both halves are booked", () => {
      const requests = [halfDay("morning"), halfDay("evening")];
      expect(findLeaveConflict(requests, halfDaySelection("morning"))).toBe(requests[0]);
      expect(findLeaveConflict(requests, halfDaySelection("evening"))).toBe(requests[1]);
    });

    it("ignores requests on other dates", () => {
      expect(
        findLeaveConflict([halfDay("morning", "pending", "2026-10-13")], halfDaySelection("morning")),
      ).toBeUndefined();
    });
  });

  describe("full-day request", () => {
    it("is blocked by an existing half-day on the date", () => {
      const existing = halfDay("morning");
      expect(findLeaveConflict([existing], fullDaySelection())).toBe(existing);
    });

    it("is blocked by an existing full-day request", () => {
      const existing = fullDay();
      expect(findLeaveConflict([existing], fullDaySelection())).toBe(existing);
    });

    it("is blocked when a range runs over a half-day on any of its dates", () => {
      const existing = halfDay("evening", "pending", "2026-10-14");
      expect(findLeaveConflict([existing], fullDaySelection("2026-10-12", "2026-10-16"))).toBe(
        existing,
      );
    });

    it("is allowed when nothing overlaps", () => {
      expect(
        findLeaveConflict([halfDay("morning", "pending", "2026-10-20")], fullDaySelection()),
      ).toBeUndefined();
      expect(findLeaveConflict([], fullDaySelection())).toBeUndefined();
    });
  });

  it("ignores rejected and cancelled requests", () => {
    const existing = [
      fullDay(DAY, DAY, "rejected"),
      halfDay("morning", "cancelled"),
      halfDay("evening", "rejected"),
    ];
    expect(findLeaveConflict(existing, fullDaySelection())).toBeUndefined();
    expect(findLeaveConflict(existing, halfDaySelection("morning"))).toBeUndefined();
    expect(findLeaveConflict(existing, halfDaySelection("evening"))).toBeUndefined();
  });

  it("reads ISO timestamps and Date objects on existing requests", () => {
    const existing: ExistingLeave = {
      start_date: "2026-10-12T00:00:00.000Z",
      end_date: new Date(2026, 9, 12),
      status: "pending",
      is_half_day: true,
      half_day_period: "morning",
    };
    expect(findLeaveConflict([existing], halfDaySelection("evening"))).toBeUndefined();
    expect(findLeaveConflict([existing], halfDaySelection("morning"))).toBe(existing);
  });

  it("does not block a half-day recorded without a period (mirrors the backend)", () => {
    const legacy: ExistingLeave = { ...halfDay("morning"), half_day_period: null };
    expect(findLeaveConflict([legacy], halfDaySelection("morning"))).toBeUndefined();
  });
});

describe("getLeaveConflictMessage", () => {
  it("points a full-day request on a half-day date at the half-day option", () => {
    const message = getLeaveConflictMessage(fullDaySelection(), halfDay("morning"));
    expect(message).toContain("half-day leave request on 2026-10-12");
    expect(message).toContain("enable \"Half-day leave\"");
  });

  it("asks for the other half when the chosen half is taken", () => {
    const message = getLeaveConflictMessage(halfDaySelection("morning"), halfDay("morning"));
    expect(message).toContain("morning half-day leave request on 2026-10-12");
    expect(message).toContain("other half of the day");
  });

  it("explains a date whose halves are both booked", () => {
    const message = getLeaveConflictMessage(halfDaySelection(""), halfDay("morning"));
    expect(message).toBe(
      "Both halves of 2026-10-12 are already covered by pending or approved leave requests. Please choose a different date.",
    );
  });

  it("explains a half-day request on a full-day date", () => {
    const message = getLeaveConflictMessage(halfDaySelection("evening"), fullDay());
    expect(message).toBe(
      "You already have a pending or approved full-day leave request on 2026-10-12. Please choose a different date.",
    );
  });

  it("keeps the generic single-date and date-range wording for full-day requests", () => {
    expect(getLeaveConflictMessage(fullDaySelection(), fullDay())).toBe(
      "You already have a pending or approved leave request on 2026-10-12. Please choose a different date.",
    );
    expect(
      getLeaveConflictMessage(fullDaySelection("2026-10-12", "2026-10-14"), halfDay("morning")),
    ).toBe(
      "You already have a pending or approved leave request between 2026-10-12 and 2026-10-14. Please choose a different date range.",
    );
  });
});

describe("findLeaveConflict with dates as the API sends them", () => {
  const wire = (month: number, day: number) => new Date(2026, month - 1, day).toISOString();
  const serializedHalfDay = (
    period: "morning" | "evening",
    month: number,
    day: number,
  ): ExistingLeave => ({
    start_date: wire(month, day),
    end_date: wire(month, day),
    status: "pending",
    is_half_day: true,
    half_day_period: period,
  });
  const selection = (period: "morning" | "evening", date: string): LeaveSelection => ({
    startIso: date,
    endIso: date,
    isHalfDay: true,
    period,
  });

  // Rows 8 and 9 of the dev database: a morning half-day on Oct 22 and an evening half-day on Oct 23.
  const morning22 = serializedHalfDay("morning", 10, 22);
  const evening23 = serializedHalfDay("evening", 10, 23);

  it("allows the free evening of a date whose morning is booked, even with an evening booked the next day", () => {
    expect(findLeaveConflict([morning22, evening23], selection("evening", "2026-10-22"))).toBeUndefined();
  });

  it("allows the free morning of the next day too", () => {
    expect(findLeaveConflict([morning22, evening23], selection("morning", "2026-10-23"))).toBeUndefined();
  });

  it("still blocks the booked period on the right day", () => {
    expect(findLeaveConflict([morning22, evening23], selection("morning", "2026-10-22"))).toBe(morning22);
    expect(findLeaveConflict([morning22, evening23], selection("evening", "2026-10-23"))).toBe(evening23);
  });

  it("does not leak a booking onto the neighbouring dates", () => {
    expect(findLeaveConflict([morning22], selection("morning", "2026-10-21"))).toBeUndefined();
    expect(findLeaveConflict([morning22], selection("morning", "2026-10-23"))).toBeUndefined();
  });
});
