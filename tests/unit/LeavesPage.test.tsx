import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LeavesPage from "@/app/(dashboard)/leaves/page";

const {
  useLeaveRequestsQueryMock,
  createLeaveMutateAsyncMock,
} = vi.hoisted(() => ({
  useLeaveRequestsQueryMock: vi.fn(),
  createLeaveMutateAsyncMock: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { employee_id: "E1" } }) }));
vi.mock("@/hooks/queries/use-leave-types-query", () => ({
  useLeaveTypesQuery: () => ({
    data: [{ id: 1, name: "Annual", is_active: true }],
    isLoading: false,
    error: null,
  }),
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

// The real picker (react-datepicker) is covered by DateRangePicker.test.tsx; here it's reduced to
// buttons that report the selections the page has to validate.
vi.mock("@/components/DateRangePicker", () => ({
  default: ({ onChange }: { onChange: (start: Date | null, end: Date | null) => void }) => (
    <div>
      <button type="button" onClick={() => onChange(new Date(2026, 9, 12), null)}>
        pick-date
      </button>
      <button type="button" onClick={() => onChange(new Date(2026, 9, 12), new Date(2026, 9, 12))}>
        pick-same-day-range
      </button>
      <button type="button" onClick={() => onChange(new Date(2026, 9, 12), new Date(2026, 9, 14))}>
        pick-multi-day-range
      </button>
    </div>
  ),
}));

const leave = (overrides: Record<string, unknown>) => ({
  id: 1,
  employee_id: "E1",
  leave_type_id: 1,
  start_date: "2026-10-12T00:00:00.000Z",
  end_date: "2026-10-12T00:00:00.000Z",
  total_days: 1,
  status: "pending",
  is_half_day: false,
  created_at: "2026-10-01T09:00:00.000Z",
  leave_type: { id: 1, name: "Annual" },
  ...overrides,
});

const morningHalfDay = leave({ id: 1, is_half_day: true, half_day_period: "morning" });
const eveningHalfDay = leave({ id: 2, is_half_day: true, half_day_period: "evening" });
const fullDay = leave({ id: 3, status: "hr_approved" });

const renderRequestForm = (requests: unknown[]) => {
  useLeaveRequestsQueryMock.mockReturnValue({ data: requests, isLoading: false, error: null });
  const utils = render(<LeavesPage />);
  // The header button and the tab share this name; both open the form.
  fireEvent.click(screen.getAllByRole("button", { name: "Request Leave" })[0]);
  return utils;
};

const pickDate = () => fireEvent.click(screen.getByText("pick-date"));
const toggleHalfDay = () => fireEvent.click(screen.getByLabelText("Half-day leave"));
const choosePeriod = (period: "morning" | "evening") =>
  fireEvent.change(screen.getByText("Select time period").closest("select")!, {
    target: { value: period },
  });
const submitButton = () => screen.getByRole("button", { name: "Submit" });

describe("LeavesPage request form - half-day conflicts (OCD-593)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createLeaveMutateAsyncMock.mockResolvedValue({});
  });

  it("lets the user pick a date that already has a half-day, then request the other half", async () => {
    const { container } = renderRequestForm([morningHalfDay]);

    // Step 5 of the ticket: the date is picked before "Half-day leave" is enabled.
    pickDate();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("2026-10-12")).toBeInTheDocument();

    toggleHalfDay();
    choosePeriod("evening");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    fireEvent.change(screen.getByText("Select leave type").closest("select")!, {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Please explain the reason/), {
      target: { value: "Dentist appointment" },
    });
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [new File(["x"], "note.pdf")] },
    });

    expect(submitButton()).toBeEnabled();
    // jsdom's constraint validation would reject the file input's stubbed `files`, so submit the form directly.
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(createLeaveMutateAsyncMock).toHaveBeenCalledTimes(1));
    const sent = createLeaveMutateAsyncMock.mock.calls[0][0] as FormData;
    expect(sent.get("start_date")).toBe("2026-10-12");
    expect(sent.get("end_date")).toBe("2026-10-12");
    expect(sent.get("is_half_day")).toBe("true");
    expect(sent.get("half_day_period")).toBe("evening");
  });

  it("also allows the morning half when the evening half is booked", () => {
    renderRequestForm([eveningHalfDay]);
    pickDate();
    toggleHalfDay();
    choosePeriod("morning");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("blocks the half-day period that is already booked and unblocks when the other is chosen", () => {
    renderRequestForm([morningHalfDay]);
    pickDate();
    toggleHalfDay();
    choosePeriod("morning");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "You already have a pending or approved morning half-day leave request on 2026-10-12.",
    );
    expect(submitButton()).toBeDisabled();
    // The date stays selected (start + auto end date) so the user can switch to the free half.
    expect(screen.getAllByText("2026-10-12")).toHaveLength(2);

    choosePeriod("evening");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("points a full-day request on a half-day date at the Half-day leave option", () => {
    renderRequestForm([morningHalfDay]);
    fireEvent.click(screen.getByText("pick-same-day-range"));

    expect(screen.getByRole("alert")).toHaveTextContent('enable "Half-day leave"');
    expect(submitButton()).toBeDisabled();

    toggleHalfDay();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("rejects a date covered by a full-day request", () => {
    renderRequestForm([fullDay]);
    pickDate();

    expect(screen.getByRole("alert")).toHaveTextContent("full-day leave request on 2026-10-12");
    expect(screen.queryByText("2026-10-12")).not.toBeInTheDocument();
  });

  it("rejects a date whose morning and evening are both booked", () => {
    renderRequestForm([morningHalfDay, eveningHalfDay]);
    pickDate();

    expect(screen.getByRole("alert")).toHaveTextContent("Both halves of 2026-10-12");
    expect(screen.queryByText("2026-10-12")).not.toBeInTheDocument();
  });

  it("rejects a multi-day range that runs over a half-day", () => {
    renderRequestForm([morningHalfDay]);
    fireEvent.click(screen.getByText("pick-multi-day-range"));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "between 2026-10-12 and 2026-10-14",
    );
    expect(screen.queryByText("2026-10-12")).not.toBeInTheDocument();
  });

  it("ignores rejected and cancelled requests", () => {
    renderRequestForm([
      leave({ id: 4, status: "rejected" }),
      leave({ id: 5, status: "cancelled", is_half_day: true, half_day_period: "morning" }),
    ]);
    pickDate();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("2026-10-12")).toBeInTheDocument();
  });
});
