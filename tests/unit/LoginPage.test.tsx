import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LoginPage from "@/app/(auth)/login/page";

const { kcLoginMock, routerMock, searchParamsMock, useAuthStoreMock, SESSION_TERMINATED_MESSAGE_KEY } =
  vi.hoisted(() => ({
    kcLoginMock: vi.fn(),
    routerMock: { replace: vi.fn() },
    searchParamsMock: { get: vi.fn() },
    useAuthStoreMock: vi.fn(),
    SESSION_TERMINATED_MESSAGE_KEY: "oxo_session_terminated_message",
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
  SESSION_TERMINATED_MESSAGE_KEY,
}));

const setAuthState = (state: { initialized: boolean; accessToken: string | null }) => {
  useAuthStoreMock.mockImplementation((selector: (s: typeof state) => unknown) => selector(state));
};

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    searchParamsMock.get.mockReturnValue(null);
    setAuthState({ initialized: true, accessToken: null });
  });

  it("redirects straight to Keycloak when there is no pending session-terminated message", () => {
    render(<LoginPage />);
    expect(kcLoginMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/redirecting to sign in/i)).toBeInTheDocument();
  });

  it("shows the session-terminated message instead of auto-redirecting, and clears it from sessionStorage (OCD-455)", () => {
    sessionStorage.setItem(
      SESSION_TERMINATED_MESSAGE_KEY,
      "This account has been logged in from another browser. Your current session has been terminated.",
    );

    render(<LoginPage />);

    expect(kcLoginMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(/this account has been logged in from another browser/i),
    ).toBeInTheDocument();
    expect(sessionStorage.getItem(SESSION_TERMINATED_MESSAGE_KEY)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /continue to sign in/i }));
    expect(kcLoginMock).toHaveBeenCalledTimes(1);
  });

  it("forwards an already-authenticated user to `next` without redirecting to Keycloak", () => {
    setAuthState({ initialized: true, accessToken: "token-123" });
    render(<LoginPage />);
    expect(routerMock.replace).toHaveBeenCalledWith("/");
    expect(kcLoginMock).not.toHaveBeenCalled();
  });
});
