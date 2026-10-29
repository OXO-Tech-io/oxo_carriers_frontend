import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminLeaveManagementPage from "@/app/admin/leaves/page";
import { resolveFileUrl } from "@/lib/constants";
import type { LeaveRequest } from "@/types";

const { useAuthMock, useLeaveRequestsQueryMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useLeaveRequestsQueryMock: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: useAuthMock }));
vi.mock("@/hooks/queries/use-leave-requests-query", () => ({ useLeaveRequestsQuery: useLeaveRequestsQueryMock }));
vi.mock("@/hooks/mutations/use-approve-leave-mutation", () => ({
  useApproveLeaveMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/hooks/mutations/use-reject-leave-mutation", () => ({
  useRejectLeaveMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

function makeRequest(overrides: Partial<LeaveRequest> = {}): LeaveRequest {
  return {
    id: 1,
    user_id: 7,
    leave_type_id: 1,
    start_date: "2026-10-12",
    end_date: "2026-10-13",
    total_days: 2,
    reason: "Medical appointment",
    status: "pending",
    created_at: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("AdminLeaveManagementPage attachment link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({ isSuperAdmin: true, isHRManager: false });
  });

  it("points at the API origin, not a path on the frontend (which 404s)", () => {
    const attachmentUrl = "/uploads/documents/d461a7d8-8d5a-464f-a1fa-3f7fb4e028f1.png";
    useLeaveRequestsQueryMock.mockReturnValue({ data: [makeRequest({ attachment_url: attachmentUrl })], isLoading: false });

    render(<AdminLeaveManagementPage />);

    const link = screen.getByRole("link", { name: /View Attachment Doc/ });
    expect(link.getAttribute("href")).toBe(resolveFileUrl(attachmentUrl));
    expect(link.getAttribute("href")).not.toBe(attachmentUrl);
    expect(link.getAttribute("href")).toMatch(/^https?:\/\//);
  });

  it("shows no attachment link when the request has none", () => {
    useLeaveRequestsQueryMock.mockReturnValue({ data: [makeRequest()], isLoading: false });

    render(<AdminLeaveManagementPage />);

    expect(screen.queryByRole("link", { name: /View Attachment Doc/ })).toBeNull();
  });
});

describe("AdminLeaveManagementPage two-stage approval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("HR Manager sees Approve on a pending request and is told the Administrator must also approve", () => {
    useAuthMock.mockReturnValue({ isSuperAdmin: false, isHRManager: true });
    useLeaveRequestsQueryMock.mockImplementation((params: { status?: string }) => ({
      data: params.status === "pending" ? [makeRequest()] : [],
      isLoading: false,
    }));

    render(<AdminLeaveManagementPage />);

    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
  });

  it("HR Manager cannot approve again once HR-Manager-approved - it awaits the Administrator", () => {
    useAuthMock.mockReturnValue({ isSuperAdmin: false, isHRManager: true });
    useLeaveRequestsQueryMock.mockImplementation((params: { status?: string }) => ({
      data: params.status === "hr_manager_approved" ? [makeRequest({ status: "hr_manager_approved" })] : [],
      isLoading: false,
    }));

    render(<AdminLeaveManagementPage />);

    expect(screen.queryByRole("button", { name: /^(Final )?Approve$/ })).toBeNull();
    expect(screen.getByText(/Awaiting Administrator approval/)).toBeInTheDocument();
  });

  it("Administrator gets Final Approve on an HR-Manager-approved request", () => {
    useAuthMock.mockReturnValue({ isSuperAdmin: true, isHRManager: false });
    useLeaveRequestsQueryMock.mockImplementation((params: { status?: string }) => ({
      data: params.status === "hr_manager_approved" ? [makeRequest({ status: "hr_manager_approved" })] : [],
      isLoading: false,
    }));

    render(<AdminLeaveManagementPage />);

    expect(screen.getByRole("button", { name: "Final Approve" })).toBeInTheDocument();
  });
});
