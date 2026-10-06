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
