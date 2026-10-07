import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DocumentViewer } from "@/components/DocumentViewer";

describe("DocumentViewer", () => {
  it("renders a PDF in an <embed> with no visible download link", () => {
    render(
      <DocumentViewer
        isOpen
        onClose={vi.fn()}
        fileUrl="http://localhost:5000/uploads/documents/handbook.pdf"
        fileName="handbook.pdf"
        mimeType="application/pdf"
      />,
    );
    const embed = document.querySelector("embed");
    expect(embed).toBeTruthy();
    // The URL fragment hides the browser PDF viewer's toolbar and side panel.
    expect(embed).toHaveAttribute(
      "src",
      "http://localhost:5000/uploads/documents/handbook.pdf#toolbar=0&navpanes=0",
    );
    expect(embed).toHaveAttribute("type", "application/pdf");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders an image file in a plain <img>", () => {
    render(
      <DocumentViewer
        isOpen
        onClose={vi.fn()}
        fileUrl="http://localhost:5000/uploads/documents/id-card.png"
        fileName="id-card.png"
        mimeType="image/png"
      />,
    );
    const img = screen.getByRole("img", { name: "id-card.png" });
    expect(img).toHaveAttribute("src", "http://localhost:5000/uploads/documents/id-card.png");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("falls back to a message for an unsupported file type instead of a download link", () => {
    render(
      <DocumentViewer
        isOpen
        onClose={vi.fn()}
        fileUrl="http://localhost:5000/uploads/documents/policy.docx"
        fileName="policy.docx"
        mimeType="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      />,
    );
    expect(screen.getByText(/can.t be previewed here/)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("blocks the right-click context menu on the viewer root (best-effort, not real DRM)", () => {
    render(
      <DocumentViewer
        isOpen
        onClose={vi.fn()}
        fileUrl="http://localhost:5000/uploads/documents/id-card.png"
        fileName="id-card.png"
        mimeType="image/png"
      />,
    );
    const img = screen.getByRole("img", { name: "id-card.png" });
    const preventDefault = vi.fn();
    const event = new Event("contextmenu", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "preventDefault", { value: preventDefault });
    img.dispatchEvent(event);
    expect(preventDefault).toHaveBeenCalled();
  });

  it("renders nothing when closed", () => {
    render(
      <DocumentViewer
        isOpen={false}
        onClose={vi.fn()}
        fileUrl="http://localhost:5000/uploads/documents/id-card.png"
        fileName="id-card.png"
        mimeType="image/png"
      />,
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
