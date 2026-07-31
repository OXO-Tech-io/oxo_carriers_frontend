import { describe, it, expect, vi, beforeEach } from "vitest";

const { kcLoginMock, kcLogoutMock, kcUpdateTokenMock } = vi.hoisted(() => ({
  kcLoginMock: vi.fn(),
  kcLogoutMock: vi.fn(),
  kcUpdateTokenMock: vi.fn(),
}));

vi.mock("@/lib/keycloak", () => ({
  kcLogin: kcLoginMock,
  kcLogout: kcLogoutMock,
  kcUpdateToken: kcUpdateTokenMock,
}));

import {
  loginRedirect,
  logoutRedirect,
  ensureFreshToken,
} from "@/lib/keycloakAuth";

describe("lib/keycloakAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loginRedirect triggers kcLogin and never resolves", async () => {
    let resolved = false;
    loginRedirect("https://app/custom").then(() => {
      resolved = true;
    });
    await Promise.resolve();
    expect(kcLoginMock).toHaveBeenCalledWith("https://app/custom");
    expect(resolved).toBe(false);
  });

  it("logoutRedirect triggers kcLogout and never resolves", async () => {
    let resolved = false;
    logoutRedirect().then(() => {
      resolved = true;
    });
    await Promise.resolve();
    expect(kcLogoutMock).toHaveBeenCalledWith(undefined);
    expect(resolved).toBe(false);
  });

  it("ensureFreshToken delegates to kcUpdateToken with the given minValidity", async () => {
    kcUpdateTokenMock.mockResolvedValueOnce("token-1");
    await expect(ensureFreshToken(60)).resolves.toBe("token-1");
    expect(kcUpdateTokenMock).toHaveBeenCalledWith(60);
  });

  it("ensureFreshToken defaults minValidity to 30", async () => {
    kcUpdateTokenMock.mockResolvedValueOnce(null);
    await ensureFreshToken();
    expect(kcUpdateTokenMock).toHaveBeenCalledWith(30);
  });
});
