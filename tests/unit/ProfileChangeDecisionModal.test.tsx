import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProfileChangeDecisionModal from "@/components/modals/ProfileChangeDecisionModal";

describe("ProfileChangeDecisionModal", () => {
  it("renders reject-specific copy and disables confirm until a reason is entered", () => {
    const onConfirm = vi.fn();
    render(
      <ProfileChangeDecisionModal isOpen onClose={vi.fn()} decision="rejected" onConfirm={onConfirm} />,
    );
    expect(screen.getByText("Reject Change Request")).toBeInTheDocument();
    const confirmButton = screen.getByRole("button", { name: "Reject Request" });
    expect(confirmButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/Explain why/), { target: { value: "Missing docs" } });
    expect(confirmButton).not.toBeDisabled();
    fireEvent.click(confirmButton);
    expect(onConfirm).toHaveBeenCalledWith("Missing docs");
  });

  it("renders return-for-modification copy and trims whitespace-only input as empty", () => {
    render(
      <ProfileChangeDecisionModal isOpen onClose={vi.fn()} decision="returned_for_modification" onConfirm={vi.fn()} />,
    );
    expect(screen.getByText("Return for Modification")).toBeInTheDocument();
    const confirmButton = screen.getByRole("button", { name: "Return to Employee" });

    fireEvent.change(screen.getByPlaceholderText(/Let the employee know/), { target: { value: "   " } });
    expect(confirmButton).toBeDisabled();
  });

  it("clears the textarea after a successful confirm", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <ProfileChangeDecisionModal isOpen onClose={vi.fn()} decision="rejected" onConfirm={onConfirm} />,
    );
    const textarea = screen.getByPlaceholderText(/Explain why/);
    fireEvent.change(textarea, { target: { value: "Bad data" } });
    fireEvent.click(screen.getByRole("button", { name: "Reject Request" }));
    await vi.waitFor(() => expect(textarea).toHaveValue(""));
  });

  it("disables Cancel and shows a loading confirm button while isLoading", () => {
    render(
      <ProfileChangeDecisionModal isOpen onClose={vi.fn()} decision="rejected" onConfirm={vi.fn()} isLoading />,
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <ProfileChangeDecisionModal isOpen={false} onClose={vi.fn()} decision="rejected" onConfirm={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
