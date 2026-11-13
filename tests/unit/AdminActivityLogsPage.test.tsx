import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminActivityLogsPage from "@/app/admin/activity-logs/page";
import type { EmployeeActivityLog, EmployeeActivitySummary } from "@/types/employee-activity";

const { useAuthMock, apiGetMock, useLogsQueryMock, useSummaryQueryMock, usePresenceQueryMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  apiGetMock: vi.fn(),
  useLogsQueryMock: vi.fn(),
  useSummaryQueryMock: vi.fn(),
  usePresenceQueryMock: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: useAuthMock }));
vi.mock("@/lib/api", () => ({ default: { get: apiGetMock } }));
vi.mock("@/hooks/queries/use-employee-activity-query", () => ({
  useEmployeeActivityLogsQuery: useLogsQueryMock,
  useEmployeeActivitySummaryQuery: useSummaryQueryMock,
  useAgentPresenceQuery: usePresenceQueryMock,
}));

const makeSummary = (overrides: Partial<EmployeeActivitySummary> = {}): EmployeeActivitySummary => ({
  employeeId: "E1",
  firstName: "Asha",
  lastName: "Perera",
  deviceId: "DEV-ASHA",
  lastEventAt: "2026-11-02T09:30:00.000Z",
  eventCount: 12,
  idleCount: 2,
  windowCount: 5,
  ...overrides,
});

const makeLog = (overrides: Partial<EmployeeActivityLog> = {}): EmployeeActivityLog => ({
  id: 1,
  employeeId: "E1",
  firstName: "Asha",
  lastName: "Perera",
  deviceId: "DEV-ASHA",
  agentLogId: 10,
  eventType: "window_focus",
  startTs: "2026-11-02T09:00:00.000Z",
  appName: "chrome.exe",
  windowTitle: "HRIS Portal",
  mouseEventCount: 7,
  keyEventCount: 3,
  mediaState: null,
  ...overrides,
});

describe("AdminActivityLogsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({ user: { id: 1 }, isSuperAdmin: true });
    useSummaryQueryMock.mockReturnValue({ data: [makeSummary()], isLoading: false });
    usePresenceQueryMock.mockReturnValue({ data: [], isLoading: false });
    useLogsQueryMock.mockReturnValue({ data: { total: 1, logs: [makeLog()] }, isLoading: false });
  });

  it("shows a permission loading state while access is being resolved", async () => {
    useAuthMock.mockReturnValue({ user: { id: 1 }, isSuperAdmin: false });
    let resolve!: (v: unknown) => void;
    apiGetMock.mockReturnValue(new Promise((r) => (resolve = r)));

    render(<AdminActivityLogsPage />);

    expect(screen.getByText("Checking permission access...")).toBeInTheDocument();
    resolve({ data: { permissionLevels: { attendance: "read" } } });
    await waitFor(() => expect(screen.getByRole("heading", { name: "Activity Logs" })).toBeInTheDocument());
  });

  it("denies access when the user has no attendance permission", async () => {
    useAuthMock.mockReturnValue({ user: { id: 1 }, isSuperAdmin: false });
    apiGetMock.mockResolvedValue({ data: { permissionLevels: {} } });

    render(<AdminActivityLogsPage />);

    expect(await screen.findByText("Access Denied")).toBeInTheDocument();
    expect(apiGetMock).toHaveBeenCalledWith("/permissions/me");
  });

  it("denies access when the permission lookup fails", async () => {
    useAuthMock.mockReturnValue({ user: { id: 1 }, isSuperAdmin: false });
    apiGetMock.mockRejectedValue(new Error("boom"));

    render(<AdminActivityLogsPage />);

    expect(await screen.findByText("Access Denied")).toBeInTheDocument();
  });

  it("allows read-level attendance permission and enables the queries", async () => {
    useAuthMock.mockReturnValue({ user: { id: 1 }, isSuperAdmin: false });
    apiGetMock.mockResolvedValue({ data: { permissionLevels: { attendance: "read" } } });

    render(<AdminActivityLogsPage />);

    expect(await screen.findByText("Event Log")).toBeInTheDocument();
    const lastCall = useLogsQueryMock.mock.calls[useLogsQueryMock.mock.calls.length - 1];
    expect(lastCall[1]).toBe(true);
  });

  it("lets a super admin in without calling the permissions API", () => {
    render(<AdminActivityLogsPage />);

    expect(screen.getByText("Event Log")).toBeInTheDocument();
    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it("renders a device card per summary with its counts", () => {
    render(<AdminActivityLogsPage />);

    expect(screen.getByText("DEV-ASHA", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText(/12 events · 5 window switches · 2 idle/)).toBeInTheDocument();
  });

  it("shows the empty state when no device reported activity", () => {
    useSummaryQueryMock.mockReturnValue({ data: [], isLoading: false });

    render(<AdminActivityLogsPage />);

    expect(screen.getByText(/No activity reported/)).toBeInTheDocument();
  });

  it("renders event rows with a labelled badge, application and window title", () => {
    render(<AdminActivityLogsPage />);

    expect(screen.getByText("Window focus", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("chrome.exe")).toBeInTheDocument();
    expect(screen.getByText("HRIS Portal")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("shows an em dash when an event has no application or window title", () => {
    useLogsQueryMock.mockReturnValue({
      data: { total: 1, logs: [makeLog({ appName: null, windowTitle: null })] },
      isLoading: false,
    });

    render(<AdminActivityLogsPage />);

    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("shows the empty and loading states of the event table", () => {
    useLogsQueryMock.mockReturnValue({ data: { total: 0, logs: [] }, isLoading: false });
    const { unmount } = render(<AdminActivityLogsPage />);
    expect(screen.getByText("No events for these filters.")).toBeInTheDocument();
    unmount();

    useLogsQueryMock.mockReturnValue({ data: undefined, isLoading: true });
    render(<AdminActivityLogsPage />);
    expect(screen.getAllByText("Loading...").length).toBeGreaterThan(0);
  });

  it("filters the log query by event type and resets to the first page", () => {
    render(<AdminActivityLogsPage />);

    fireEvent.change(screen.getByDisplayValue("All events"), { target: { value: "idle_start" } });

    const lastParams = useLogsQueryMock.mock.calls[useLogsQueryMock.mock.calls.length - 1][0];
    expect(lastParams.eventType).toBe("idle_start");
    expect(lastParams.offset).toBe(0);
    expect(lastParams.limit).toBe(25);
  });

  it("selecting a device card filters by that employee and toggles off on second click", () => {
    render(<AdminActivityLogsPage />);
    const card = screen.getByText("DEV-ASHA", { selector: "p" }).closest("button")!;

    fireEvent.click(card);
    let params = useLogsQueryMock.mock.calls[useLogsQueryMock.mock.calls.length - 1][0];
    expect(params.employeeId).toBe("E1");

    fireEvent.click(card);
    params = useLogsQueryMock.mock.calls[useLogsQueryMock.mock.calls.length - 1][0];
    expect(params.employeeId).toBeUndefined();
  });

  it("queries the same date range for the summary and the logs", () => {
    render(<AdminActivityLogsPage />);

    const summaryParams = useSummaryQueryMock.mock.calls[0][0];
    const logParams = useLogsQueryMock.mock.calls[0][0];
    expect(summaryParams.from).toBe(logParams.from);
    expect(summaryParams.to).toBe(logParams.to);
  });

  it("shows pagination only when the total exceeds one page", () => {
    useLogsQueryMock.mockReturnValue({
      data: { total: 60, logs: [makeLog()] },
      isLoading: false,
    });

    render(<AdminActivityLogsPage />);

    expect(screen.getByText(/60/)).toBeInTheDocument();
  });
});
