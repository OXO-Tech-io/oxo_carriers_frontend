/**
 * Thin client for Keycloak's OIDC token endpoint. Used by the auth store to
 * exchange username/password for tokens (Direct Access Grants / ROPC), refresh
 * the access token, and end the session.
 *
 * The PKCE / authorization-code flow is intentionally not used here — the
 * application owns its own login UI, so credentials go straight to Keycloak's
 * /token endpoint.
 */

const KC_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
const REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
const CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;

if (!KC_URL || !REALM || !CLIENT_ID) {
  throw new Error(
    "Missing NEXT_PUBLIC_KEYCLOAK_URL / NEXT_PUBLIC_KEYCLOAK_REALM / NEXT_PUBLIC_KEYCLOAK_CLIENT_ID",
  );
}

const buildTokenEndpoint = (realm: string) =>
  `${KC_URL}/realms/${realm}/protocol/openid-connect/token`;

const buildLogoutEndpoint = (realm: string) =>
  `${KC_URL}/realms/${realm}/protocol/openid-connect/logout`;

const realmCandidates = Array.from(
  new Set([REALM, REALM.toLowerCase(), REALM.toUpperCase()]),
);

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

const submitForm = async (
  url: string,
  params: Record<string, string>,
): Promise<Response> => {
  const body = new URLSearchParams(params);
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
};

const submitFormWithRealmFallback = async (
  endpointBuilder: (realm: string) => string,
  params: Record<string, string>,
): Promise<Response> => {
  let lastResponse: Response | null = null;

  for (const realm of realmCandidates) {
    const response = await submitForm(endpointBuilder(realm), params);
    if (response.ok || response.status !== 404) {
      return response;
    }
    lastResponse = response;
  }

  return lastResponse as Response;
};

export const passwordLogin = async (
  username: string,
  password: string,
): Promise<TokenResponse> => {
  const res = await submitFormWithRealmFallback(buildTokenEndpoint, {
    grant_type: "password",
    client_id: CLIENT_ID,
    username,
    password,
    scope: "openid",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error_description?: string;
      error?: string;
    };
    throw new Error(
      body.error_description || body.error || `Login failed (${res.status})`,
    );
  }
  return res.json() as Promise<TokenResponse>;
};

export const refreshTokens = async (
  refreshToken: string,
): Promise<TokenResponse> => {
  const res = await submitFormWithRealmFallback(buildTokenEndpoint, {
    grant_type: "refresh_token",
    client_id: CLIENT_ID,
    refresh_token: refreshToken,
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed (${res.status})`);
  }
  return res.json() as Promise<TokenResponse>;
};

export const endSession = async (refreshToken: string): Promise<void> => {
  // Best-effort — don't throw if Keycloak is unreachable on logout
  await submitFormWithRealmFallback(buildLogoutEndpoint, {
    client_id: CLIENT_ID,
    refresh_token: refreshToken,
  }).catch(() => undefined);
};
