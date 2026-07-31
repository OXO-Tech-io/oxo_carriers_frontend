import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// useAuth pulls in authStore -> keycloakAuth -> keycloak.ts, which throws at import time
// unless NEXT_PUBLIC_KEYCLOAK_* env vars are set. This test only cares about the store-derived
// role/auth flags, so the keycloak-js adapter layer is mocked out entirely (same approach as
// tests/unit/authStore.test.ts).
vi.mock("@/lib/keycloakAuth", () => ({
  loginRedirect: vi.fn(),
  logoutRedirect: vi.fn(),
  ensureFreshToken: vi.fn(),
}));
vi.mock("@/lib/keycloak", () => ({ getKeycloak: vi.fn() }));

import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";

describe("useAuth", () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      initialized: false,
    });
  });

  it("reports unauthenticated when there is no access token", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("reports authenticated once an access token is present", () => {
    useAuthStore.setState({ accessToken: "tok" });
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(true);
  });

  it.each([
    ["super_admin", "isSuperAdmin"],
    ["hr_manager", "isHRManager"],
    ["hr_executive", "isHRExecutive"],
    ["employee", "isEmployee"],
    ["consultant", "isConsultant"],
    ["service_provider", "isServiceProvider"],
    ["finance_manager", "isFinanceManager"],
    ["finance_executive", "isFinanceExecutive"],
  ] as const)("derives %s -> %s from the user role", (role, flag) => {
    useAuthStore.setState({ user: { role } as any });
    const { result } = renderHook(() => useAuth());
    expect((result.current as any)[flag]).toBe(true);
  });

  it("isHR is true for hr_manager or hr_executive, isFinance for finance roles", () => {
    act(() => useAuthStore.setState({ user: { role: "hr_manager" } as any }));
    expect(renderHook(() => useAuth()).result.current.isHR).toBe(true);

    act(() => useAuthStore.setState({ user: { role: "hr_executive" } as any }));
    expect(renderHook(() => useAuth()).result.current.isHR).toBe(true);

    act(() => useAuthStore.setState({ user: { role: "finance_manager" } as any }));
    expect(renderHook(() => useAuth()).result.current.isFinance).toBe(true);

    act(() => useAuthStore.setState({ user: { role: "employee" } as any }));
    const { result } = renderHook(() => useAuth());
    expect(result.current.isHR).toBe(false);
    expect(result.current.isFinance).toBe(false);
  });
});
