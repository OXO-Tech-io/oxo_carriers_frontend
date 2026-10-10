import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/(auth)/login/page";

const { kcLoginMock, routerMock, searchParamsMock, useAuthStoreMock } = vi.hoisted(() => ({
  kcLoginMock: vi.fn(),
  routerMock: { replace: vi.fn() },
  searchParamsMock: { get: vi.fn() },
  useAuthStoreMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => searchParamsMock,
}));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- test stub, not real rendering
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt ?? ""} />,
}));
vi.mock("@/store/authStore", () => ({ useAuthStore: useAuthStoreMock }));
vi.mock("@/lib/keycloak", () => ({
  kcLogin: kcLoginMock,
}));

const setAuthState = (state: { initialized: boolean; accessToken: string | null }) => {
  useAuthStoreMock.mockImplementation((selector: (s: typeof state) => unknown) => selector(state));
};

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsMock.get.mockReturnValue(null);
    setAuthState({ initialized: true, accessToken: null });
  });

  it("redirects straight to Keycloak when the user is not signed in", () => {
    render(<LoginPage />);
    expect(kcLoginMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/redirecting to sign in/i)).toBeInTheDocument();
  });

  it("forwards an already-authenticated user to `next` without redirecting to Keycloak", () => {
    setAuthState({ initialized: true, accessToken: "token-123" });
    render(<LoginPage />);
    expect(routerMock.replace).toHaveBeenCalledWith("/");
    expect(kcLoginMock).not.toHaveBeenCalled();
  });
});
