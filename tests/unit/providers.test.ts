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
    await claimSessionIfPendingNewLogin();

    expect(apiPostMock).toHaveBeenCalledWith("/auth/claim-sessions");
    expect(sessionStorage.getItem(PENDING_NEW_LOGIN_KEY)).toBeNull();
  });

  it("resolves only after the claim request finishes, and never rejects if it fails", async () => {
    sessionStorage.setItem(PENDING_NEW_LOGIN_KEY, "1");
    getKeycloakMock.mockReturnValue({ authenticated: true });
    let finish!: () => void;
    apiPostMock.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));

    const { claimSessionIfPendingNewLogin } = await import("@/app/providers");
    let done = false;
    const pending = claimSessionIfPendingNewLogin().then(() => (done = true));
    await Promise.resolve();
    expect(done).toBe(false);
    finish();
    await pending;
    expect(done).toBe(true);

    sessionStorage.setItem(PENDING_NEW_LOGIN_KEY, "1");
    apiPostMock.mockRejectedValue(new Error("boom"));
    await expect(claimSessionIfPendingNewLogin()).resolves.toBeUndefined();
  });

  it("does nothing when there is no pending-new-login flag (silent SSO restore / token refresh)", async () => {
    getKeycloakMock.mockReturnValue({ authenticated: true });

    const { claimSessionIfPendingNewLogin } = await import("@/app/providers");
    await claimSessionIfPendingNewLogin();

    expect(apiPostMock).not.toHaveBeenCalled();
  });

  it("does not claim the session if init did not end up authenticated", async () => {
    sessionStorage.setItem(PENDING_NEW_LOGIN_KEY, "1");
    getKeycloakMock.mockReturnValue({ authenticated: false });

    const { claimSessionIfPendingNewLogin } = await import("@/app/providers");
    await claimSessionIfPendingNewLogin();

    expect(apiPostMock).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(PENDING_NEW_LOGIN_KEY)).toBeNull();
  });
});
