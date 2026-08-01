import { describe, it, expect, vi, beforeEach } from "vitest";

const { loginRedirectMock, logoutRedirectMock, ensureFreshTokenMock, getKeycloakMock } =
  vi.hoisted(() => ({
    loginRedirectMock: vi.fn(),
    logoutRedirectMock: vi.fn(),
    ensureFreshTokenMock: vi.fn(),
    getKeycloakMock: vi.fn(),
  }));

vi.mock("@/lib/keycloakAuth", () => ({
  loginRedirect: loginRedirectMock,
  logoutRedirect: logoutRedirectMock,
  ensureFreshToken: ensureFreshTokenMock,
}));

vi.mock("@/lib/keycloak", () => ({
  getKeycloak: getKeycloakMock,
}));

import { useAuthStore } from "@/store/authStore";

describe("useAuthStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      initialized: false,
    });
  });

  it("login triggers loginRedirect", async () => {
    loginRedirectMock.mockResolvedValue(undefined);
    await useAuthStore.getState().login();
    expect(loginRedirectMock).toHaveBeenCalled();
  });

  it("logout clears the user and triggers logoutRedirect", async () => {
    useAuthStore.setState({ user: { id: 1 } as any });
    logoutRedirectMock.mockResolvedValue(undefined);
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(logoutRedirectMock).toHaveBeenCalled();
  });

  it("setUser and setInitialized update state directly", () => {
    useAuthStore.getState().setUser({ id: 5 } as any);
    expect(useAuthStore.getState().user).toEqual({ id: 5 });
    useAuthStore.getState().setInitialized(true);
    expect(useAuthStore.getState().initialized).toBe(true);
  });

  it("syncFromKeycloak clears tokens when there is no authenticated keycloak session", () => {
    getKeycloakMock.mockReturnValue(null);
    useAuthStore.setState({ accessToken: "stale", refreshToken: "stale", expiresAt: 123 });
    useAuthStore.getState().syncFromKeycloak();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
    expect(useAuthStore.getState().expiresAt).toBeNull();
  });

  it("syncFromKeycloak pulls tokens and computed expiry from an authenticated session", () => {
    getKeycloakMock.mockReturnValue({
      authenticated: true,
      token: "access-1",
      refreshToken: "refresh-1",
      tokenParsed: { exp: 1000 },
    });
    useAuthStore.getState().syncFromKeycloak();
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("access-1");
    expect(state.refreshToken).toBe("refresh-1");
    expect(state.expiresAt).toBe(1000 * 1000);
  });

  it("refresh calls ensureFreshToken and re-syncs from keycloak", async () => {
    ensureFreshTokenMock.mockResolvedValue("new-token");
    getKeycloakMock.mockReturnValue({
      authenticated: true,
      token: "new-token",
      refreshToken: "refresh-2",
      tokenParsed: { exp: 2000 },
    });
    const result = await useAuthStore.getState().refresh();
    expect(result).toBe("new-token");
    expect(useAuthStore.getState().accessToken).toBe("new-token");
  });
});
