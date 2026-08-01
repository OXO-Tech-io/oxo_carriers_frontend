import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

const { useAuthMock, routerMock, usePathnameMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  routerMock: { replace: vi.fn(), push: vi.fn() },
  usePathnameMock: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: useAuthMock }));
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  usePathname: usePathnameMock,
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePathnameMock.mockReturnValue("/dashboard");
  });

  it("redirects to login and shows a redirecting message when unauthenticated", () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false, user: null });
    render(
      <ProtectedRoute>
        <p>Secret</p>
      </ProtectedRoute>,
    );
    expect(routerMock.replace).toHaveBeenCalledWith("/login?next=%2Fdashboard");
    expect(screen.getByText("Redirecting to login...")).toBeInTheDocument();
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });

  it("shows a loading state when a token exists but the profile hasn't hydrated yet", () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true, user: null });
    render(
      <ProtectedRoute>
        <p>Secret</p>
      </ProtectedRoute>,
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it("renders children once authenticated with a hydrated user and no role restriction", () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true, user: { role: "employee" } });
    render(
      <ProtectedRoute>
        <p>Secret</p>
      </ProtectedRoute>,
    );
    expect(screen.getByText("Secret")).toBeInTheDocument();
  });

  it("renders an Access Denied message when the user's role isn't allowed", () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true, user: { role: "employee" } });
    render(
      <ProtectedRoute allowedRoles={["hr_manager"]}>
        <p>Secret</p>
      </ProtectedRoute>,
    );
    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });

  it("renders children when the user's role is in allowedRoles", () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true, user: { role: "hr_manager" } });
    render(
      <ProtectedRoute allowedRoles={["hr_manager", "super_admin"]}>
        <p>Secret</p>
      </ProtectedRoute>,
    );
    expect(screen.getByText("Secret")).toBeInTheDocument();
  });
});
