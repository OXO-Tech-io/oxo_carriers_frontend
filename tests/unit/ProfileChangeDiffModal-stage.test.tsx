import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ProfileChangeDiffModal from "@/components/modals/ProfileChangeDiffModal";
import type { ProfileChangeRequest } from "@/types/profile";

const baseRequest = {
  id: 7,
  userId: 1,
  submittedBy: 1,
  status: "pending_approval",
  changes: [],
  comments: null,
  reviewerId: null,
  reviewerComments: null,
  decidedAt: null,
  previousRequestId: null,
  createdAt: "2026-10-20T10:00:00.000Z",
  updatedAt: "2026-10-20T10:00:00.000Z",
} as unknown as ProfileChangeRequest;

describe("ProfileChangeDiffModal approval stage (OCD-603/604/605)", () => {
  it("shows the HR Manager stage and the decision actions for the stage owner", () => {
    render(
      <ProfileChangeDiffModal
        isOpen
        onClose={vi.fn()}
        request={{ ...baseRequest, approvalStage: "hr_manager" }}
        canDecide
      />,
    );
    expect(screen.getByText(/Awaiting HR Manager approval/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
  });

  it("shows the Administrator stage with the HR Manager's comment and hides actions for others", () => {
    render(
      <ProfileChangeDiffModal
        isOpen
        onClose={vi.fn()}
        request={{
          ...baseRequest,
          approvalStage: "admin",
          hrManagerApprovedAt: "2026-10-21T10:00:00.000Z",
          hrManagerComments: "Verified NIC",
        }}
        canDecide={false}
      />,
    );
    expect(screen.getByText(/Awaiting Administrator approval/)).toBeInTheDocument();
    expect(screen.getByText(/Verified NIC/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  });
});
