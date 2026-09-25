import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ResetPasswordPage from "@/app/(auth)/reset-password/page";

const { apiMock, routerMock, searchParamsMock } = vi.hoisted(() => ({
  apiMock: { post: vi.fn() },
  routerMock: { push: vi.fn() },
  searchParamsMock: { get: vi.fn() },
}));

vi.mock("@/lib/api", () => ({ default: apiMock }));
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => searchParamsMock,
}));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- test stub, not real rendering
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt ?? ""} />,
}));

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsMock.get.mockReturnValue("valid-token");
  });

  const getSubmitButton = () => screen.getByRole("button", { name: /set new password/i });

  it("disables submit and shows failing rules while the password is weak", () => {
    render(<ResetPasswordPage />);
    const newPassword = screen.getByLabelText(/^new password$/i);

    fireEvent.change(newPassword, { target: { value: "abc" } });

    expect(getSubmitButton()).toBeDisabled();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    // At least one failing rule is rendered with the ✖ marker.
    expect(screen.getAllByText("✖").length).toBeGreaterThan(0);
  });

  it("rejects a denylisted password even though it's long enough", () => {
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: "qwerty123" } });
    expect(getSubmitButton()).toBeDisabled();
    expect(screen.getByText(/not a common or easily guessable password/i)).toBeInTheDocument();
  });

  it("enables submit only once every rule passes and the confirmation matches", () => {
    render(<ResetPasswordPage />);
    const newPassword = screen.getByLabelText(/^new password$/i);
    const confirmPassword = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(newPassword, { target: { value: "Str0ng!Pass" } });
    expect(getSubmitButton()).toBeDisabled();

    fireEvent.change(confirmPassword, { target: { value: "Str0ng!Pass" } });
    expect(getSubmitButton()).not.toBeDisabled();
    expect(screen.getAllByText("✔")).toHaveLength(6);
  });

  it("submits the new password once valid and redirects on success", async () => {
    apiMock.post.mockResolvedValue({ data: { success: true } });
    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: "Str0ng!Pass" } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: "Str0ng!Pass" } });
    fireEvent.click(getSubmitButton());

    await waitFor(() =>
      expect(apiMock.post).toHaveBeenCalledWith("/auth/reset-password", {
        token: "valid-token",
        newPassword: "Str0ng!Pass",
      }),
    );
    await waitFor(() => expect(screen.getByText(/password reset successfully/i)).toBeInTheDocument());
  });

  it("shows the invalid-link state when there is no token", () => {
    searchParamsMock.get.mockReturnValue(null);
    render(<ResetPasswordPage />);
    expect(screen.getByText(/invalid link/i)).toBeInTheDocument();
  });
});
