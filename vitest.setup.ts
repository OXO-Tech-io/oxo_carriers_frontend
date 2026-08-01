import "@testing-library/jest-dom/vitest";

// lib/keycloak.ts throws at import time in the browser if these are unset (real app config comes
// from .env.local, which isn't loaded under Vitest). Many components only need a *different* named
// export from a barrel file (e.g. `@/components/ui`) that also re-exports something transitively
// importing `@/lib/api` -> `@/lib/keycloakAuth` -> `@/lib/keycloak`, so the throw can surface even
// in tests that never touch auth. Dummy defaults here keep those imports side-effect-free; tests
// that exercise keycloak.ts directly still override these via vi.stubEnv per-test.
process.env.NEXT_PUBLIC_KEYCLOAK_URL ||= "https://keycloak.test";
process.env.NEXT_PUBLIC_KEYCLOAK_REALM ||= "test-realm";
process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ||= "test-client";
