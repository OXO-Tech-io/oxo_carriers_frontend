/** sessionStorage key holding the current tab's work-session token. */
export const ATTENDANCE_SESSION_TOKEN_KEY = 'attendance:sessionToken';

/**
 * Close the current work session on the way out of the page.
 *
 * `POST attendance/session/end` is deliberately @Public() server-side because
 * `navigator.sendBeacon` cannot attach an Authorization header - the 64-hex
 * session token is the credential, and it only ever closes the one session it
 * names. That is why there is no bearer-token variant here.
 *
 * Safe to call when no session is open; it simply returns.
 */
export function endSessionBeacon(baseUrl: string): void {
  if (typeof window === 'undefined') return;

  const sessionToken = sessionStorage.getItem(ATTENDANCE_SESSION_TOKEN_KEY);
  if (!sessionToken) return;

  const url = `${baseUrl}/attendance/session/end`;
  const payload = JSON.stringify({ sessionToken });

  const sent =
    typeof navigator !== 'undefined' && navigator.sendBeacon
      ? navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }))
      : false;

  if (!sent) {
    // `keepalive` lets the request outlive the document the same way a beacon
    // does, for browsers where sendBeacon is missing or refused the payload.
    fetch(url, {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {});
  }

  sessionStorage.removeItem(ATTENDANCE_SESSION_TOKEN_KEY);
}
