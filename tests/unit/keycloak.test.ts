import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { KeycloakMock, lastInstance } = vi.hoisted(() => {
  const state: { instance: any } = { instance: null };
  const KeycloakMock = vi.fn().mockImplementation(function (this: any, opts: any) {
    this.opts = opts;
    this.authenticated = false;
    this.token = undefined;
    this.refreshToken = undefined;
    this.tokenParsed = undefined;
    this.init = vi.fn().mockResolvedValue(true);
    this.login = vi.fn();
    this.logout = vi.fn();
    this.updateToken = vi.fn().mockResolvedValue(true);
    state.instance = this;
    return this;
  });
  return { KeycloakMock, lastInstance: state };
});

vi.mock("keycloak-js", () => ({ default: KeycloakMock }));

describe("lib/keycloak", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_KEYCLOAK_URL", "https://kc.example.com");
    vi.stubEnv("NEXT_PUBLIC_KEYCLOAK_REALM", "oxo");
    vi.stubEnv("NEXT_PUBLIC_KEYCLOAK_CLIENT_ID", "web");
    vi.stubEnv("NEXT_PUBLIC_KEYCLOAK_LOCALE", "");
    vi.stubEnv("NEXT_PUBLIC_KEYCLOAK_IDP_HINT", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("getKeycloak returns a singleton instance built from env config", async () => {
    const { getKeycloak } = await import("@/lib/keycloak");
    const first = getKeycloak();
    const second = getKeycloak();
    expect(first).toBe(second);
    expect(KeycloakMock).toHaveBeenCalledTimes(1);
    expect(KeycloakMock).toHaveBeenCalledWith({
      url: "https://kc.example.com",
      realm: "oxo",
      clientId: "web",
    });
  });

  it("initKeycloak calls kc.init once and memoizes the promise", async () => {
    const { initKeycloak } = await import("@/lib/keycloak");
    const first = initKeycloak();
    const second = initKeycloak();
    expect(first).toBe(second);
    await expect(first).resolves.toBe(true);
    expect(lastInstance.instance.init).toHaveBeenCalledTimes(1);
    expect(lastInstance.instance.init).toHaveBeenCalledWith(
      expect.objectContaining({ onLoad: "check-sso", pkceMethod: "S256" }),
    );
  });

  it("kcLogin triggers kc.login with a default redirect to origin", async () => {
    const { kcLogin } = await import("@/lib/keycloak");
    kcLogin();
    expect(lastInstance.instance.login).toHaveBeenCalledWith(
      expect.objectContaining({ redirectUri: expect.stringContaining("/") }),
    );
  });

  it("kcLogin honors an explicit redirectUri", async () => {
    const { kcLogin } = await import("@/lib/keycloak");
    kcLogin("https://app.example.com/custom");
    expect(lastInstance.instance.login).toHaveBeenCalledWith(
      expect.objectContaining({ redirectUri: "https://app.example.com/custom" }),
    );
  });

  it("kcLogout triggers kc.logout with a default redirect to /login/", async () => {
    const { kcLogout } = await import("@/lib/keycloak");
    kcLogout();
    expect(lastInstance.instance.logout).toHaveBeenCalledWith(
      expect.objectContaining({ redirectUri: expect.stringContaining("/login/") }),
    );
  });

  it("kcUpdateToken returns null when not authenticated", async () => {
    const { kcUpdateToken } = await import("@/lib/keycloak");
    lastInstance.instance = null;
    const { getKeycloak } = await import("@/lib/keycloak");
    getKeycloak();
    const token = await kcUpdateToken();
    expect(token).toBeNull();
  });

  it("kcUpdateToken refreshes and returns the token when authenticated", async () => {
    const { getKeycloak, kcUpdateToken } = await import("@/lib/keycloak");
    const kc = getKeycloak()!;
    kc.authenticated = true;
    kc.token = "abc123";
    const token = await kcUpdateToken(30);
    expect(kc.updateToken).toHaveBeenCalledWith(30);
    expect(token).toBe("abc123");
  });

  it("kcUpdateToken returns null when updateToken rejects", async () => {
    const { getKeycloak, kcUpdateToken } = await import("@/lib/keycloak");
    const kc = getKeycloak()!;
    kc.authenticated = true;
    kc.updateToken = vi.fn().mockRejectedValue(new Error("expired"));
    const token = await kcUpdateToken();
    expect(token).toBeNull();
  });
});
