import React from "react";
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LeavesPage from "@/app/(dashboard)/leaves/page";

const { useLeaveRequestsQueryMock, createLeaveMutateAsyncMock } = vi.hoisted(() => ({
  useLeaveRequestsQueryMock: vi.fn(),
  createLeaveMutateAsyncMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ default: { get: vi.fn().mockResolvedValue({ data: { data: [] } }) } }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { employee_id: "SA001" } }) }));
vi.mock("@/hooks/queries/use-leave-types-query", () => ({
  useLeaveTypesQuery: () => ({ data: [{ id: 1, name: "Annual", is_active: true }], isLoading: false, error: null }),
}));
vi.mock("@/hooks/queries/use-leave-balance-query", () => ({
  useLeaveBalanceQuery: () => ({
    data: [{ id: 1, leave_type_id: 1, available_days: 10, remaining_days: 10 }],
    isLoading: false,
    error: null,
  }),
}));
vi.mock("@/hooks/queries/use-holidays-query", () => ({
  useHolidaysQuery: () => ({ data: [], isLoading: false, error: null }),
}));
vi.mock("@/hooks/queries/use-leave-requests-query", () => ({
  useLeaveRequestsQuery: useLeaveRequestsQueryMock,
}));
vi.mock("@/hooks/mutations/use-create-leave-mutation", () => ({
  useCreateLeaveMutation: () => ({ mutateAsync: createLeaveMutateAsyncMock, isPending: false }),
}));

// Unlike LeavesPage.test.tsx, this drives the real DateRangePicker (react-datepicker) with leave
// rows exactly as the API serializes them. A DATE column goes out as the instant of its local
// midnight, so with the server in UTC+5:30 the 22nd arrives as "2026-10-21T18:30:00.000Z" - the
// stub-picker tests with UTC-style fixtures could not see the day shift this guards against.
beforeAll(() => {
  vi.stubEnv("TZ", "Asia/Colombo");
});
afterAll(() => {
  vi.unstubAllEnvs();
});

const wire = (month: number, day: number) => new Date(2026, month - 1, day).toISOString();

// Rows 8 and 9 of the dev database: a morning half-day on Oct 22 and an evening half-day on Oct 23.
const leave = (id: number, period: "morning" | "evening", day: number) => ({
  id,
  employee_id: "SA001",
  leave_type_id: 1,
  start_date: wire(10, day),
  end_date: wire(10, day),
  total_days: 0.5,
  status: "pending",
  is_half_day: true,
  half_day_period: period,
  created_at: "2026-10-09T09:00:00.000Z",
  leave_type: { id: 1, name: "Annual" },
});

// react-datepicker also renders a screen-reader announcer with role="alert"; only the page's own
// error box counts here.
const formAlert = () =>
  screen.queryAllByRole("alert").find((el) => !el.classList.contains("react-datepicker__aria-live"));

const chooseCalendarDay = (label: RegExp) => fireEvent.click(screen.getByRole("gridcell", { name: label }));
const toggleHalfDay = () => fireEvent.click(screen.getByLabelText("Half-day leave"));
const choosePeriod = (period: "morning" | "evening") =>
  fireEvent.change(screen.getByText("Select time period").closest("select")!, { target: { value: period } });

describe("LeavesPage with the real calendar - requesting the other half of a date (OCD-593)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Only Date is faked, so the picker's minDate (today) is stable without stalling timers.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 9, 10, 0));
    createLeaveMutateAsyncMock.mockResolvedValue({});
    useLeaveRequestsQueryMock.mockReturnValue({
      data: [leave(9, "evening", 23), leave(8, "morning", 22)],
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lets the evening of a morning-booked date be requested, and still blocks the booked morning", async () => {
    const { container } = render(<LeavesPage />);
    fireEvent.click(screen.getAllByRole("button", { name: "Request Leave" })[0]);

    // Ticket steps 5-7: pick the date, enable half-day, pick the free period.
    chooseCalendarDay(/October 22nd, 2026/);
    expect(formAlert()).toBeUndefined();
    toggleHalfDay();
    choosePeriod("evening");
    expect(formAlert()).toBeUndefined();

    // The period that is genuinely taken on that date is still refused.
    choosePeriod("morning");
    expect(formAlert()).toHaveTextContent("morning half-day leave request on 2026-10-22");
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();

    choosePeriod("evening");
    expect(formAlert()).toBeUndefined();

    fireEvent.change(screen.getByText("Select leave type").closest("select")!, { target: { value: "1" } });
    fireEvent.change(screen.getByPlaceholderText(/Please explain the reason/), {
      target: { value: "Dentist appointment" },
    });
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [new File(["x"], "note.pdf")] },
    });
    expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();

    // jsdom's constraint validation would reject the file input's stubbed `files`, so submit directly.
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(createLeaveMutateAsyncMock).toHaveBeenCalledTimes(1));
    const sent = createLeaveMutateAsyncMock.mock.calls[0][0] as FormData;
    expect(sent.get("start_date")).toBe("2026-10-22");
    expect(sent.get("end_date")).toBe("2026-10-22");
    expect(sent.get("is_half_day")).toBe("true");
    expect(sent.get("half_day_period")).toBe("evening");
  });

  it("treats the next day's evening booking as that day's, not the day before's", () => {
    render(<LeavesPage />);
    fireEvent.click(screen.getAllByRole("button", { name: "Request Leave" })[0]);

    chooseCalendarDay(/October 23rd, 2026/);
    toggleHalfDay();
    choosePeriod("morning");
    expect(formAlert()).toBeUndefined();

    choosePeriod("evening");
    expect(formAlert()).toHaveTextContent("evening half-day leave request on 2026-10-23");
  });
});
