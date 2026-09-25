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

  it("disables submit until the confirmation matches the new password", () => {
    render(<ResetPasswordPage />);
    const newPassword = screen.getByLabelText(/^new password$/i);
    const confirmPassword = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(newPassword, { target: { value: "Str0ng!Pass" } });
    expect(getSubmitButton()).toBeDisabled();

    fireEvent.change(confirmPassword, { target: { value: "Different1!" } });
    expect(getSubmitButton()).toBeDisabled();
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();

    fireEvent.change(confirmPassword, { target: { value: "Str0ng!Pass" } });
    expect(getSubmitButton()).not.toBeDisabled();
    expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
  });

  it("does not enforce a client-side password policy (the Keycloak realm policy does)", () => {
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: "abc" } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: "abc" } });

    expect(getSubmitButton()).not.toBeDisabled();
    expect(screen.queryByText(/password strength/i)).not.toBeInTheDocument();
    expect(screen.queryByText("✖")).not.toBeInTheDocument();
  });

  it("shows the server's message when the password is rejected", async () => {
    apiMock.post.mockRejectedValue({
      response: { data: { message: "Password does not meet the realm password policy" } },
    });
    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: "abc" } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: "abc" } });
    fireEvent.click(getSubmitButton());

    await waitFor(() =>
      expect(screen.getByText(/does not meet the realm password policy/i)).toBeInTheDocument(),
    );
    expect(routerMock.push).not.toHaveBeenCalled();
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
