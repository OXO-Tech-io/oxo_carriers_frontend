import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
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

  it("renders a color swatch next to the pending and approved leave legend labels", async () => {
    render(
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
    await waitFor(() => expect(apiMock.get).toHaveBeenCalled());

    const pendingSwatch = screen.getByText("Your Pending Leave").previousElementSibling;
    const approvedSwatch = screen.getByText("Your Approved Leave").previousElementSibling;

    // The swatches are styled inline: the calendar's `.holiday-calendar .leave-day--*`
    // rules don't reach the legend, which renders outside the calendar element.
    expect(pendingSwatch).toHaveClass("bg-[var(--warning-light)]", "border");
    expect(approvedSwatch).toHaveClass("bg-[var(--success-light)]", "border");
    expect(pendingSwatch?.className).not.toBe(approvedSwatch?.className);

    // The AM/PM half-day samples reuse the day-cell chip, which is absolutely
    // positioned; the legend modifier keeps them in the flow beside their label.
    expect(screen.getByText("AM")).toHaveClass("leave-period-chip", "leave-period-chip--legend");
    expect(screen.getByText("PM")).toHaveClass("leave-period-chip", "leave-period-chip--legend");
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

  describe("leave markers in the day cells (OCD-593)", () => {
    const day = (d: number) => new Date(2026, 9, d);
    const halfDay = (period: "morning" | "evening", d: number, status = "pending") => ({
      start_date: day(d),
      end_date: day(d),
      status,
      is_half_day: true,
      half_day_period: period,
    });
    const renderCalendar = async (existingLeaveRequests: React.ComponentProps<typeof DateRangePicker>["existingLeaveRequests"]) => {
      render(
        <DateRangePicker
          inline
          monthsShown={1}
          startDate={day(1)}
          endDate={null}
          onChange={vi.fn()}
          existingLeaveRequests={existingLeaveRequests}
        />,
      );
      await waitFor(() => expect(apiMock.get).toHaveBeenCalled());
    };
    const cell = (d: number) =>
      screen.getByRole("gridcell", { name: new RegExp(`October ${d}(st|nd|rd|th), 2026`) });

    it("tags a morning half-day AM and colours only the top half", async () => {
      await renderCalendar([halfDay("morning", 22)]);
      expect(cell(22)).toHaveClass("leave-day--halves", "leave-day--am-pending");
      expect(cell(22)).not.toHaveClass("leave-day--pm-pending", "leave-day--pm-approved");
      const tag = within(cell(22)).getByText("AM");
      expect(tag).toHaveClass("leave-period-chip", "leave-period-chip--pending", "leave-period-chip--am");
      expect(tag).toHaveAttribute("title", "Pending leave (Morning)");
      expect(within(cell(22)).queryByText("PM")).not.toBeInTheDocument();
    });

    it("tags an approved evening half-day PM in the approved colour", async () => {
      await renderCalendar([halfDay("evening", 23, "hr_approved")]);
      expect(cell(23)).toHaveClass("leave-day--halves", "leave-day--pm-approved");
      const tag = within(cell(23)).getByText("PM");
      expect(tag).toHaveClass("leave-period-chip--approved", "leave-period-chip--pm");
      expect(tag).toHaveAttribute("title", "Approved leave (Evening)");
      expect(within(cell(23)).queryByText("AM")).not.toBeInTheDocument();
    });

    it("shows both tags, each in its own status colour, when a date has both halves booked", async () => {
      await renderCalendar([halfDay("evening", 26, "hr_approved"), halfDay("morning", 26)]);
      expect(cell(26)).toHaveClass("leave-day--halves", "leave-day--am-pending", "leave-day--pm-approved");
      expect(within(cell(26)).getByText("AM")).toHaveClass("leave-period-chip--pending");
      expect(within(cell(26)).getByText("PM")).toHaveClass("leave-period-chip--approved");
    });

    it("keeps a date with a half-day selectable", async () => {
      await renderCalendar([halfDay("morning", 22)]);
      expect(cell(22)).toHaveAttribute("aria-disabled", "false");
    });

    it("tints a full-day request across the whole cell with no half tags, and disables it", async () => {
      await renderCalendar([
        { start_date: day(27), end_date: day(27), status: "hr_approved", is_half_day: false },
      ]);
      expect(cell(27)).toHaveClass("leave-day--approved");
      expect(cell(27)).not.toHaveClass("leave-day--halves");
      expect(within(cell(27)).queryByText("AM")).not.toBeInTheDocument();
      expect(within(cell(27)).queryByText("PM")).not.toBeInTheDocument();
      expect(cell(27)).toHaveAttribute("aria-disabled", "true");
    });

    it("leaves rejected and cancelled requests unmarked", async () => {
      await renderCalendar([halfDay("morning", 22, "rejected"), halfDay("evening", 22, "cancelled")]);
      expect(cell(22)).not.toHaveClass("leave-day--halves");
      expect(within(cell(22)).queryByText("AM")).not.toBeInTheDocument();
      expect(within(cell(22)).queryByText("PM")).not.toBeInTheDocument();
    });
  });
});
