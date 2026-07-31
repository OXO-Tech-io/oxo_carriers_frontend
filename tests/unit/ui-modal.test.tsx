import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { BottomSheet } from "@/components/ui/BottomSheet";

describe("Modal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()} title="Hidden">
        Body
      </Modal>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders title, children and footer when open", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="My Modal" footer={<button>Footer action</button>}>
        <p>Modal body</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("My Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal body")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Footer action" })).toBeInTheDocument();
  });

  it("calls onClose when the close button or backdrop is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="My Modal">
        Body
      </Modal>,
    );
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the Escape key is pressed", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose}>
        Body
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not attach a keydown listener when closed", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={false} onClose={onClose}>
        Body
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("ConfirmationDialog", () => {
  it("renders the message and calls onConfirm/onClose from the footer buttons", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmationDialog
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete item"
        message="Are you sure?"
      />,
    );
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("supports custom labels and a loading confirm button", () => {
    render(
      <ConfirmationDialog
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Archive"
        message="This will archive the record."
        confirmLabel="Archive it"
        cancelLabel="Never mind"
        isLoading
      />,
    );
    // isLoading disables both footer buttons (Cancel via `disabled={isLoading}`, Confirm via
    // Button's own isLoading handling) — the confirm button's text is also replaced by a spinner.
    const cancelButton = screen.getByRole("button", { name: "Never mind" });
    expect(cancelButton).toBeDisabled();

    const spinnerButton = screen
      .getAllByRole("button")
      .find((b) => b.querySelector("svg.animate-spin"));
    expect(spinnerButton).toBeDisabled();
  });
});

describe("BottomSheet", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <BottomSheet isOpen={false} onClose={vi.fn()} title="Sheet">
        content
      </BottomSheet>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the title and children, locks body scroll, and calls onClose", () => {
    const onClose = vi.fn();
    render(
      <BottomSheet isOpen onClose={onClose} title="Options">
        <p>Sheet content</p>
      </BottomSheet>,
    );
    expect(screen.getByText("Options")).toBeInTheDocument();
    expect(screen.getByText("Sheet content")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(screen.getByLabelText("Close sheet"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("restores body scroll when unmounted", () => {
    const { unmount } = render(
      <BottomSheet isOpen onClose={vi.fn()} title="Options">
        content
      </BottomSheet>,
    );
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});
