# Keycloak Login Setup — OXO Carriers Frontend

The frontend uses **Authorization Code + PKCE (S256)** via `keycloak-js`. The
browser redirects to Keycloak's login page, then back to the app with tokens.
No password is ever handled by the OXO app.

## 1. Environment variables

Both projects need their `.env` to point at the **same** Keycloak realm. The
realm name is **case-sensitive** — copy it exactly from the admin console.

### `oxo_carriers_frontend/.env`

```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:5400
NEXT_PUBLIC_KEYCLOAK_REALM=oxo-hris
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=oxo-carriers-frontend
```

### `oxo_carriers_backend/.env`

```
KC_URL=http://localhost:5400
KC_REALM=oxo-hris
KC_AUDIENCE=oxo-hris-backend
KC_BACKEND_CLIENT_ID=oxo-hris-backend
KC_BACKEND_CLIENT_SECRET=<from-keycloak>
```

> Use exactly the same realm value everywhere: `oxo-hris`.

## 2. Keycloak client config — `oxo-carriers-frontend`

In the Keycloak admin console (`http://localhost:5400/admin`):
**Clients → `oxo-carriers-frontend` → Settings**

| Setting | Value |
|---|---|
| Client type | OpenID Connect |
| Client authentication | **Off** (public client) |
| Standard flow | **On** |
| Direct access grants | Off (no longer needed) |
| Implicit flow | Off |
| Service accounts | Off |

**Access settings:**

| Field | Value |
|---|---|
| Root URL | `http://localhost:3000` |
| Home URL | `http://localhost:3000/` |
| Valid redirect URIs | `http://localhost:3000/*` |
| Valid post-logout redirect URIs | `http://localhost:3000/login/` (and `/*`) |
| Web origins | `http://localhost:3000` (or `+` to use redirect URI list) |

For production, add the deployed origins to the lists above
(e.g. `https://app.oxocareers.com/*`).

**Advanced → Proof Key for Code Exchange Code Challenge Method:** `S256`

## 2.1. Activate custom OXO login theme on Keycloak

Your frontend always redirects to Keycloak's login page, so branding must be
enabled in Keycloak realm settings.

1. Build/deploy Keycloak with the theme folder copied to:
   `/opt/keycloak/themes/oxo-hris`
2. In admin console, open **Realm settings → Themes**
3. Set **Login theme** to `oxo-hris`
4. Save and test in a private/incognito browser window

Theme source is in:
`keycloak-theme/themes/oxo-hris/login/`

If you deploy via Docker image, use this copy step in your Keycloak image build:

```dockerfile
COPY themes/oxo-hris /opt/keycloak/themes/oxo-hris
```

## 3. Audience mapper on `oxo-carriers-frontend`

The backend rejects tokens whose `aud` doesn't include `oxo-hris-backend`. By
default, frontend-issued tokens won't include it. Add a mapper once:

**Clients → `oxo-carriers-frontend` → Client Scopes → `oxo-carriers-frontend-dedicated`
→ Add mapper → By configuration → Audience**

| Field | Value |
|---|---|
| Name | `oxo-hris-backend-audience` |
| Included Client Audience | `oxo-hris-backend` |
| Add to access token | **On** |

Save. New tokens will now have `aud: [..., "oxo-hris-backend"]`.

## 4. Create a test user

**Users → Add user**

| Field | Value |
|---|---|
| Username | `test@example.com` |
| Email | `test@example.com` |
| Email verified | On |

Then on the **Credentials** tab, set the password (e.g. `Test@123`) and
**uncheck "Temporary"** — otherwise the redirect flow will force a password
change on every login until you do.

Assign realm roles on the **Role mapping** tab (`employee`, `hr_manager`,
`super_admin`, etc.) — these map to the OXO DB roles via the priority list in
[oxo_carriers_backend/src/middleware/auth.ts](../oxo_carriers_backend/src/middleware/auth.ts).

## 5. Verify the flow

1. `cd oxo_carriers_backend && pnpm dev`
2. `cd oxo_carriers_frontend && pnpm dev`
3. Open `http://localhost:3000` — you should be redirected to
   `http://localhost:5400/realms/<realm>/protocol/openid-connect/auth?...`
   with `code_challenge` and `code_challenge_method=S256` (matching the URL
   you sent as the reference).
4. Sign in as the test user. Keycloak redirects back; the app loads with
   `/auth/me` populated.
5. Logout: the redirect goes to Keycloak's end-session endpoint, which
   redirects back to `/login/`.

## 6. Troubleshooting

| Symptom | Likely cause |
|---|---|
| 401 from `/auth/me` immediately after login | Backend rejected token: audience or issuer mismatch. Decode the access token (jwt.io) and check `iss` and `aud`. |
| Redirect loop on `/login/` | Realm/client name mismatch in `.env`, or `Valid redirect URIs` doesn't include `/login/`. |
| `Invalid parameter: redirect_uri` from Keycloak | Frontend redirect URI not in the client's allowed list. |
| Browser console: `Failed to receive message from SSO iframe` | `silent-check-sso.html` not reachable at `/silent-check-sso.html`. It's served from `public/`. |
| Login works but every API call 401s | Audience mapper missing on `oxo-carriers-frontend` (step 3). |
