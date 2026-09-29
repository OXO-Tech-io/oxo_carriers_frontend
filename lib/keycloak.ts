'use client';

import Keycloak from 'keycloak-js';

const KC_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
const KC_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
const KC_CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
const KC_LOCALE = process.env.NEXT_PUBLIC_KEYCLOAK_LOCALE;
const KC_IDP_HINT = process.env.NEXT_PUBLIC_KEYCLOAK_IDP_HINT;

const isBrowser = (): boolean => globalThis.window !== undefined;
const getOrigin = (): string | undefined => globalThis.window?.location.origin;

/**
 * OCD-455: set right before an explicit, interactive `kc.login()` redirect
 * and read back in `app/providers.tsx` once that flow completes. Marks the
 * resulting session as one to "claim" as the account's sole active session
 * via POST /auth/claim-sessions - distinct from a silent SSO restore or a
 * plain token refresh, neither of which set this flag, so neither ever
 * calls claim-sessions.
 */
export const PENDING_NEW_LOGIN_KEY = 'oxo_pending_new_login';

/**
 * OCD-455: set by lib/api.ts's response interceptor when the backend rejects
 * a request because this session was superseded by a login elsewhere, and
 * read back on the login page to explain why the user landed there.
 */
export const SESSION_TERMINATED_MESSAGE_KEY = 'oxo_session_terminated_message';

if (isBrowser() && (!KC_URL || !KC_REALM || !KC_CLIENT_ID)) {
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
  if (!isBrowser()) return null;
  instance ??= new Keycloak({
    url: KC_URL!,
    realm: KC_REALM!,
    clientId: KC_CLIENT_ID!,
  });
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
    silentCheckSsoRedirectUri: getOrigin()
      ? `${getOrigin()}/silent-check-sso.html`
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
  const origin = getOrigin();

  const loginOptions: {
    redirectUri?: string;
    locale?: string;
    idpHint?: string;
  } = {
    redirectUri: redirectUri ?? (origin ? `${origin}/` : undefined),
  };

  if (KC_LOCALE) {
    loginOptions.locale = KC_LOCALE;
  }

  if (KC_IDP_HINT) {
    loginOptions.idpHint = KC_IDP_HINT;
  }

  try {
    sessionStorage.setItem(PENDING_NEW_LOGIN_KEY, '1');
  } catch {
    // Best-effort - a private window or blocked storage just means this
    // login won't claim the session; it'll still work, only without OCD-455
    // enforcement kicking in for it.
  }

  kc.login({
    ...loginOptions,
  });
};

/**
 * Redirect to Keycloak's end-session endpoint, which clears the SSO cookie and
 * sends the browser back to `redirectUri` (defaults to /login).
 */
export const kcLogout = (redirectUri?: string): void => {
  const kc = getKeycloak();
  if (!kc) return;
  const origin = getOrigin();

  kc.logout({
    redirectUri: redirectUri ?? (origin ? `${origin}/login/` : undefined),
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
  if (!kc?.authenticated) return null;
  try {
    await kc.updateToken(minValidity);
    return kc.token ?? null;
  } catch {
    return null;
  }
};
