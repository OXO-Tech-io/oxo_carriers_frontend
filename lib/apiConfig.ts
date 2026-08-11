/**
 * The API base URL, in a leaf module of its own.
 *
 * `lib/api.ts` already imports `store/authStore`, so anything in the store that
 * needs the base URL (attendance's end-session beacon, fired from `logout()`)
 * would close an import cycle by reading it from there. Defining it here keeps
 * the dependency one-way; `lib/api.ts` re-exports it as `API_BASE_URL` for the
 * usual callers.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://backend.oxocareers.com/api/v1'
    : 'http://localhost:5000/api/v1');
