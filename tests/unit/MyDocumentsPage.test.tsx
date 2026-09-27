import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MyDocumentsPage from "@/app/(dashboard)/my-documents/page";

const { useMyDocumentsQueryMock } = vi.hoisted(() => ({
  useMyDocumentsQueryMock: vi.fn(),
}));

vi.mock("@/hooks/queries/use-documents-query", () => ({
  useMyDocumentsQuery: useMyDocumentsQueryMock,
}));

const companyDoc = {
  id: 1,
  title: "Employee Handbook",
  description: "Read me",
  targetType: "all" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
  version: "1.0",
  isMandatoryViewing: true,
  attachments: [
    { id: 10, fileName: "handbook.pdf", fileUrl: "/uploads/documents/handbook.pdf", mimeType: "application/pdf" },
  ],
};

// OCD-499: employees can only VIEW a shared document inline, not download it -
// clicking an attachment must open the in-app DocumentViewer, never a raw
// file-URL anchor/new tab.
describe("MyDocumentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMyDocumentsQueryMock.mockReturnValue({ data: [companyDoc], isLoading: false });
  });

  it("does not render the attachment as a downloadable anchor link", () => {
    render(<MyDocumentsPage />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("handbook.pdf")).toBeInTheDocument();
  });

  it("opens the in-app viewer (not a new tab) when an attachment is clicked", () => {
    render(<MyDocumentsPage />);
    fireEvent.click(screen.getByText("handbook.pdf"));

    const embed = document.querySelector("embed");
    expect(embed).toBeTruthy();
    expect(embed).toHaveAttribute("src", expect.stringContaining("/uploads/documents/handbook.pdf"));
  });

  it("shows the version tag and Mandatory badge", () => {
    render(<MyDocumentsPage />);
    expect(screen.getByText("v1.0")).toBeInTheDocument();
    expect(screen.getByText("Mandatory")).toBeInTheDocument();
  });
});
