import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AdminBookingCalendarPage from "@/app/admin/facilities/calendar/page";

const { useMyPermissionLevelMock, facilityServiceMock } = vi.hoisted(() => ({
  useMyPermissionLevelMock: vi.fn(),
  facilityServiceMock: { listFacilities: vi.fn(), getAllBookings: vi.fn() },
}));

// The page gates on the facilities:write permission (not role flags) - OCD-591.
vi.mock("@/hooks/useMyPermissionLevel", () => ({ useMyPermissionLevel: useMyPermissionLevelMock }));
vi.mock("@/lib/services/facility.service", () => ({ facilityService: facilityServiceMock }));

const booking = {
  id: 7,
  facility_id: 2,
  user_id: 9,
  start_time: new Date(2026, 9, 14, 9, 0).toISOString(),
  end_time: new Date(2026, 9, 14, 10, 0).toISOString(),
  purpose: "Sprint planning",
  status: "confirmed" as const,
  created_at: "2026-10-01T00:00:00.000Z",
  updated_at: "2026-10-01T00:00:00.000Z",
  facility_name: "Boardroom A",
  first_name: "Nadia",
  last_name: "Perera",
};

describe("AdminBookingCalendarPage (OCD-591)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    useMyPermissionLevelMock.mockReturnValue({ allowed: true, loaded: true });
    facilityServiceMock.listFacilities.mockResolvedValue([{ id: 2, name: "Boardroom A" }]);
    facilityServiceMock.getAllBookings.mockResolvedValue([booking]);
  });

  it("checks the facilities permission at write level, not the user's role", () => {
    render(<AdminBookingCalendarPage />);
    expect(useMyPermissionLevelMock).toHaveBeenCalledWith("facilities", "write");
  });

  it("opens for anyone holding the permission and loads the month's bookings", async () => {
    render(<AdminBookingCalendarPage />);

    expect(screen.queryByText("Unauthorized")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Booking Calendar" })).toBeInTheDocument();

    await waitFor(() => expect(facilityServiceMock.getAllBookings).toHaveBeenCalledTimes(1));
    const params = facilityServiceMock.getAllBookings.mock.calls[0][0];
    expect(params.start_date).toMatch(/^\d{4}-\d{2}-01$/);
    expect(params.end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(params.facility_id).toBeUndefined();

    // Booking shows in the "Detailed Schedule" list (and the grid cell title).
    expect(await screen.findByText("Sprint planning")).toBeInTheDocument();
    expect(facilityServiceMock.listFacilities).toHaveBeenCalled();
  });

  it("shows Unauthorized and fetches nothing when the permission is missing", async () => {
    useMyPermissionLevelMock.mockReturnValue({ allowed: false, loaded: true });
    render(<AdminBookingCalendarPage />);

    expect(screen.getByText("Unauthorized")).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 0));
    expect(facilityServiceMock.getAllBookings).not.toHaveBeenCalled();
    expect(facilityServiceMock.listFacilities).not.toHaveBeenCalled();
  });

  it("renders nothing (no Unauthorized flash) while the permission is still loading", async () => {
    useMyPermissionLevelMock.mockReturnValue({ allowed: false, loaded: false });
    const { container } = render(<AdminBookingCalendarPage />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("Unauthorized")).not.toBeInTheDocument();
    expect(facilityServiceMock.getAllBookings).not.toHaveBeenCalled();
  });

  it("filters by the chosen facility", async () => {
    render(<AdminBookingCalendarPage />);
    await waitFor(() => expect(facilityServiceMock.getAllBookings).toHaveBeenCalledTimes(1));
    await screen.findByRole("option", { name: "Boardroom A" });

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });

    await waitFor(() => expect(facilityServiceMock.getAllBookings).toHaveBeenCalledTimes(2));
    expect(facilityServiceMock.getAllBookings.mock.calls[1][0].facility_id).toBe(2);
  });

  it("shows an error instead of an empty 'No bookings' message when loading fails", async () => {
    facilityServiceMock.getAllBookings.mockRejectedValue(new Error("boom"));
    render(<AdminBookingCalendarPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load bookings");
    expect(screen.queryByText("No bookings found for this period.")).not.toBeInTheDocument();
  });

  it("shows the empty state when the month simply has no bookings", async () => {
    facilityServiceMock.getAllBookings.mockResolvedValue([]);
    render(<AdminBookingCalendarPage />);

    expect(await screen.findByText("No bookings found for this period.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
