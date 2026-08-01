import { describe, it, expect, vi, beforeEach } from "vitest";

const { captured, createMock, ensureFreshTokenMock, syncFromKeycloakMock, logoutMock } =
  vi.hoisted(() => {
    const captured: {
      request?: (config: any) => any;
      responseFulfilled?: (response: any) => any;
      responseRejected?: (error: any) => any;
    } = {};

    const createMock = vi.fn(() => ({
      interceptors: {
        request: {
          use: vi.fn((fn: any) => {
            captured.request = fn;
          }),
        },
        response: {
          use: vi.fn((onFulfilled: any, onRejected: any) => {
            captured.responseFulfilled = onFulfilled;
            captured.responseRejected = onRejected;
          }),
        },
      },
    }));

    return {
      captured,
      createMock,
      ensureFreshTokenMock: vi.fn(),
      syncFromKeycloakMock: vi.fn(),
      logoutMock: vi.fn(),
    };
  });

vi.mock("axios", () => ({
  default: { create: createMock },
}));

vi.mock("@/lib/keycloakAuth", () => ({
  ensureFreshToken: ensureFreshTokenMock,
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: {
    getState: () => ({
      syncFromKeycloak: syncFromKeycloakMock,
      logout: logoutMock,
    }),
  },
}));

describe("lib/api", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await import("@/lib/api");
  });

  it("creates an axios instance with credentials enabled", () => {
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }),
    );
  });

  it("request interceptor attaches a bearer token and re-syncs the store when one is available", async () => {
    ensureFreshTokenMock.mockResolvedValueOnce("fresh-token");
    const config = { headers: {} as Record<string, string> };
    const result = await captured.request!(config);

    expect(result.headers.Authorization).toBe("Bearer fresh-token");
    expect(syncFromKeycloakMock).toHaveBeenCalled();
  });

  it("request interceptor leaves config untouched when there is no token", async () => {
    ensureFreshTokenMock.mockResolvedValueOnce(null);
    const config = { headers: {} as Record<string, string> };
    const result = await captured.request!(config);

    expect(result.headers.Authorization).toBeUndefined();
    expect(syncFromKeycloakMock).not.toHaveBeenCalled();
  });

  it("response interceptor passes through successful responses unchanged", () => {
    const response = { data: { ok: true } };
    expect(captured.responseFulfilled!(response)).toBe(response);
  });

  it("response interceptor logs out and rejects on a 401", async () => {
    logoutMock.mockResolvedValue(undefined);
    const error = { response: { status: 401 } };

    await expect(captured.responseRejected!(error)).rejects.toBe(error);
    expect(logoutMock).toHaveBeenCalled();
  });

  it("response interceptor rejects without logging out on other errors", async () => {
    const error = { response: { status: 500 } };
    await expect(captured.responseRejected!(error)).rejects.toBe(error);
    expect(logoutMock).not.toHaveBeenCalled();
  });
});
