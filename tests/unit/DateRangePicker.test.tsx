import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import DateRangePicker from "@/components/DateRangePicker";

const { apiMock } = vi.hoisted(() => ({ apiMock: { get: vi.fn() } }));
vi.mock("@/lib/api", () => ({ default: apiMock }));

describe("DateRangePicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.get.mockResolvedValue({ data: { data: [] } });
  });

  it("fetches holidays on mount when showHolidays is true", async () => {
    render(<DateRangePicker startDate={null} endDate={null} onChange={vi.fn()} />);
    await waitFor(() => expect(apiMock.get).toHaveBeenCalled());
    expect(apiMock.get.mock.calls[0][0]).toContain("/leave-calendars/range");
  });

  it("does not fetch holidays when showHolidays is false", async () => {
    render(
      <DateRangePicker startDate={null} endDate={null} onChange={vi.fn()} showHolidays={false} />,
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(apiMock.get).not.toHaveBeenCalled();
  });

  it("shows the calendar indicator legend when showHolidays is true", async () => {
    render(<DateRangePicker startDate={null} endDate={null} onChange={vi.fn()} />);
    expect(screen.getByText("Calendar Indicators:")).toBeInTheDocument();
    await waitFor(() => expect(apiMock.get).toHaveBeenCalled());
  });

  it("hides the calendar legend when showHolidays is false", () => {
    render(
      <DateRangePicker startDate={null} endDate={null} onChange={vi.fn()} showHolidays={false} />,
    );
    expect(screen.queryByText("Calendar Indicators:")).not.toBeInTheDocument();
  });

  it("shows leave-marker legend items only when existingLeaveRequests is non-empty", async () => {
    const { rerender } = render(
      <DateRangePicker startDate={null} endDate={null} onChange={vi.fn()} />,
    );
    await waitFor(() => expect(apiMock.get).toHaveBeenCalled());
    expect(screen.queryByText("Your Pending Leave")).not.toBeInTheDocument();
    expect(screen.queryByText("Your Approved Leave")).not.toBeInTheDocument();

    rerender(
      <DateRangePicker
        startDate={null}
        endDate={null}
        onChange={vi.fn()}
        existingLeaveRequests={[
          { start_date: "2026-01-05", end_date: "2026-01-06", status: "pending" },
          { start_date: "2026-01-10", end_date: "2026-01-10", status: "hr_approved" },
        ]}
      />,
    );
    expect(screen.getByText("Your Pending Leave")).toBeInTheDocument();
    expect(screen.getByText("Your Approved Leave")).toBeInTheDocument();
  });

  it("shows the selected range summary once both dates are set", async () => {
    render(
      <DateRangePicker
        startDate={new Date("2026-01-05")}
        endDate={new Date("2026-01-10")}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/Selected Range:/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 5, 2026 - Jan 10, 2026/)).toBeInTheDocument();
    await waitFor(() => expect(apiMock.get).toHaveBeenCalled());
  });

  it("omits the range summary when only one date is set", async () => {
    render(<DateRangePicker startDate={new Date("2026-01-05")} endDate={null} onChange={vi.fn()} />);
    expect(screen.queryByText(/Selected Range:/)).not.toBeInTheDocument();
    await waitFor(() => expect(apiMock.get).toHaveBeenCalled());
  });

  it("renders the underlying date input without crashing when disabled", async () => {
    const { container } = render(
      <DateRangePicker startDate={null} endDate={null} onChange={vi.fn()} disabled />,
    );
    expect(container.querySelector("input")).toBeInTheDocument();
    await waitFor(() => expect(apiMock.get).toHaveBeenCalled());
  });
});
