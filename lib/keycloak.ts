'use client';

import Keycloak from 'keycloak-js';

const KC_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
const KC_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
const KC_CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;

if (typeof window !== 'undefined' && (!KC_URL || !KC_REALM || !KC_CLIENT_ID)) {
  throw new Error(
    'Missing NEXT_PUBLIC_KEYCLOAK_URL / NEXT_PUBLIC_KEYCLOAK_REALM / NEXT_PUBLIC_KEYCLOAK_CLIENT_ID',
  );
}

let instance: Keycloak | null = null;
let initPromise: Promise<boolean> | null = null;

/**
 * Singleton browser-only Keycloak instance. SSR-safe (returns null on the server).
 */
export const getKeycloak = (): Keycloak | null => {
  if (typeof window === 'undefined') return null;
  if (!instance) {
    instance = new Keycloak({
      url: KC_URL!,
      realm: KC_REALM!,
      clientId: KC_CLIENT_ID!,
    });
  }
  return instance;
};

export interface InitOptions {
  /** Called whenever the access token is updated (after init, refresh, or relogin). */
  onTokens?: () => void;
}

/**
 * Initialize Keycloak. Safe to call repeatedly — only runs init() once per page load.
 *
 * Uses Authorization Code + PKCE (S256). On first call:
 *   - If returning from a Keycloak redirect, exchanges the code for tokens.
 *   - Otherwise, attempts a silent SSO check against the iframe at
 *     /silent-check-sso.html. If a KC session cookie exists, the user is
 *     logged in transparently; if not, init resolves with authenticated=false.
 *
 * Returns true if authenticated, false otherwise.
 */
export const initKeycloak = (options: InitOptions = {}): Promise<boolean> => {
  const kc = getKeycloak();
  if (!kc) return Promise.resolve(false);

  if (initPromise) return initPromise;

  kc.onAuthSuccess = () => options.onTokens?.();
  kc.onAuthRefreshSuccess = () => options.onTokens?.();
  kc.onAuthLogout = () => options.onTokens?.();
  kc.onTokenExpired = () => {
    // Try to refresh proactively; auth interceptor will retry if this fails.
    kc.updateToken(30).catch(() => undefined);
  };

  initPromise = kc.init({
    onLoad: 'check-sso',
    pkceMethod: 'S256',
    checkLoginIframe: false,
    silentCheckSsoRedirectUri:
      typeof window !== 'undefined'
        ? `${window.location.origin}/silent-check-sso.html`
        : undefined,
    silentCheckSsoFallback: false,
  });

  return initPromise;
};

/**
 * Redirect the browser to the Keycloak login page. After successful login,
 * Keycloak redirects back to `redirectUri` (defaults to current page).
 */
export const kcLogin = (redirectUri?: string): void => {
  const kc = getKeycloak();
  if (!kc) return;
  kc.login({
    redirectUri:
      redirectUri ??
      (typeof window !== 'undefined' ? window.location.origin + '/' : undefined),
  });
};

/**
 * Redirect to Keycloak's end-session endpoint, which clears the SSO cookie and
 * sends the browser back to `redirectUri` (defaults to /login).
 */
export const kcLogout = (redirectUri?: string): void => {
  const kc = getKeycloak();
  if (!kc) return;
  kc.logout({
    redirectUri:
      redirectUri ??
      (typeof window !== 'undefined' ? `${window.location.origin}/login/` : undefined),
  });
};

/**
 * Refresh the access token if it's within `minValidity` seconds of expiry.
 * Returns the current (possibly refreshed) token, or null if not authenticated.
 */
export const kcUpdateToken = async (
  minValidity = 30,
): Promise<string | null> => {
  const kc = getKeycloak();
  if (!kc || !kc.authenticated) return null;
  try {
    await kc.updateToken(minValidity);
    return kc.token ?? null;
  } catch {
    return null;
  }
};
