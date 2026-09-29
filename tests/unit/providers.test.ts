import { describe, it, expect, vi, beforeEach } from "vitest";

const { apiPostMock, getKeycloakMock, PENDING_NEW_LOGIN_KEY } = vi.hoisted(() => ({
  apiPostMock: vi.fn(),
  getKeycloakMock: vi.fn(),
  PENDING_NEW_LOGIN_KEY: "oxo_pending_new_login",
}));

vi.mock("@/lib/api", () => ({ default: { post: apiPostMock } }));
vi.mock("@/lib/keycloak", () => ({
  getKeycloak: getKeycloakMock,
  initKeycloak: vi.fn(),
  PENDING_NEW_LOGIN_KEY,
}));
vi.mock("@/lib/mappers/user.mapper", () => ({ mapDbUserToAppUser: vi.fn() }));

describe("providers/claimSessionIfPendingNewLogin (OCD-455)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("claims the session and clears the flag when a fresh login just completed", async () => {
    sessionStorage.setItem(PENDING_NEW_LOGIN_KEY, "1");
    getKeycloakMock.mockReturnValue({ authenticated: true });
    apiPostMock.mockResolvedValue({ data: { success: true } });

    const { claimSessionIfPendingNewLogin } = await import("@/app/providers");
    claimSessionIfPendingNewLogin();

    expect(apiPostMock).toHaveBeenCalledWith("/auth/claim-sessions");
    expect(sessionStorage.getItem(PENDING_NEW_LOGIN_KEY)).toBeNull();
  });

  it("does nothing when there is no pending-new-login flag (silent SSO restore / token refresh)", async () => {
    getKeycloakMock.mockReturnValue({ authenticated: true });

    const { claimSessionIfPendingNewLogin } = await import("@/app/providers");
    claimSessionIfPendingNewLogin();

    expect(apiPostMock).not.toHaveBeenCalled();
  });

  it("does not claim the session if init did not end up authenticated", async () => {
    sessionStorage.setItem(PENDING_NEW_LOGIN_KEY, "1");
    getKeycloakMock.mockReturnValue({ authenticated: false });

    const { claimSessionIfPendingNewLogin } = await import("@/app/providers");
    claimSessionIfPendingNewLogin();

    expect(apiPostMock).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(PENDING_NEW_LOGIN_KEY)).toBeNull();
  });
});
