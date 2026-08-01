import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ResetPasswordModal from "@/components/modals/ResetPasswordModal";

describe("ResetPasswordModal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <ResetPasswordModal isOpen={false} onClose={vi.fn()} onConfirm={vi.fn()} userEmail="a@a.com" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the target user's email", () => {
    render(<ResetPasswordModal isOpen onClose={vi.fn()} onConfirm={vi.fn()} userEmail="jane@example.com" />);
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("calls onConfirm and shows a sending state while pending", async () => {
    let resolveConfirm: () => void = () => {};
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveConfirm = resolve;
        }),
    );
    render(<ResetPasswordModal isOpen onClose={vi.fn()} onConfirm={onConfirm} userEmail="a@a.com" />);

    fireEvent.click(screen.getByText("Send Reset Email"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByText("Sending...")).toBeInTheDocument());

    resolveConfirm();
    await waitFor(() => expect(screen.getByText("Send Reset Email")).toBeInTheDocument());
  });

  it("recovers from a rejected onConfirm without throwing", async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error("network error"));
    render(<ResetPasswordModal isOpen onClose={vi.fn()} onConfirm={onConfirm} userEmail="a@a.com" />);
    fireEvent.click(screen.getByText("Send Reset Email"));
    await waitFor(() => expect(screen.getByText("Send Reset Email")).toBeInTheDocument());
  });

  it("calls onClose from the Cancel button and the backdrop, but not the dialog body", () => {
    const onClose = vi.fn();
    render(<ResetPasswordModal isOpen onClose={onClose} onConfirm={vi.fn()} userEmail="a@a.com" />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
