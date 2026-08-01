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

  it("shows the holiday indicator legend when showHolidays is true", async () => {
    render(<DateRangePicker startDate={null} endDate={null} onChange={vi.fn()} />);
    expect(screen.getByText("Holiday Indicators:")).toBeInTheDocument();
    await waitFor(() => expect(apiMock.get).toHaveBeenCalled());
  });

  it("hides the holiday legend when showHolidays is false", () => {
    render(
      <DateRangePicker startDate={null} endDate={null} onChange={vi.fn()} showHolidays={false} />,
    );
    expect(screen.queryByText("Holiday Indicators:")).not.toBeInTheDocument();
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
