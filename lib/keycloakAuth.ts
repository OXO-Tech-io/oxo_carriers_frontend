/**
 * Thin adapter over `keycloak-js` for the rest of the app to consume.
 *
 * Authorization Code + PKCE (S256) is now used: the browser redirects to
 * Keycloak's login page, which redirects back with an auth code. `keycloak-js`
 * exchanges the code for tokens entirely client-side. The old ROPC
 * (Direct Access Grants) flow has been removed.
 */

import { kcLogin, kcLogout, kcUpdateToken } from './keycloak';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

/**
 * Trigger the redirect to Keycloak's login page. Returns a never-resolving
 * promise because the browser navigates away before this returns.
 */
export const loginRedirect = (redirectUri?: string): Promise<never> => {
  kcLogin(redirectUri);
  return new Promise<never>(() => undefined);
};

/**
 * Trigger the redirect to Keycloak's end-session endpoint. Same pattern as
 * `loginRedirect` — returns a never-resolving promise.
 */
export const logoutRedirect = (redirectUri?: string): Promise<never> => {
  kcLogout(redirectUri);
  return new Promise<never>(() => undefined);
};

/**
 * Returns a valid access token, refreshing if it's within 30s of expiry.
 * Returns null if not authenticated or refresh fails.
 */
export const ensureFreshToken = (
  minValidity = 30,
): Promise<string | null> => kcUpdateToken(minValidity);
