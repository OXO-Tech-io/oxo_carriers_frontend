import type { DeviceType, StartSessionPayload } from '@/types/attendance';

/**
 * Best-effort device classification from the User-Agent, touch support and
 * screen width. Deliberately dependency-free and approximate: the server also
 * sniffs the UA it receives, and nothing security-relevant hangs off this - it
 * only labels the "you already have a session open on ..." conflict prompt.
 */
export function inferDeviceType(): DeviceType {
  if (typeof navigator === 'undefined') return 'other';

  const ua = navigator.userAgent ?? '';

  // Tablets first: most tablet UAs also match the generic "mobile" markers.
  if (/\b(iPad|Tablet|PlayBook|Silk)\b/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    return 'tablet';
  }
  if (/(Android|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini|Mobile)/i.test(ua)) {
    return 'mobile';
  }

  // iPadOS 13+ reports a desktop Safari UA; the touch points give it away.
  const touchPoints = typeof navigator.maxTouchPoints === 'number' ? navigator.maxTouchPoints : 0;
  if (/Macintosh/i.test(ua) && touchPoints > 1) return 'tablet';

  if (/(Windows|Macintosh|Linux|CrOS|X11)/i.test(ua)) {
    // No web API distinguishes a laptop from a desktop. Screen width is the
    // only signal available, and a narrow non-touch screen is far more likely
    // to be a laptop panel than a desktop monitor.
    const width = typeof screen !== 'undefined' ? screen.width : 0;
    return width > 0 && width <= 1600 ? 'laptop' : 'desktop';
  }

  return 'other';
}

/** Body for POST attendance/session/start. No IP - the server derives it. */
export function collectSessionMetadata(): StartSessionPayload {
  const payload: StartSessionPayload = { deviceType: inferDeviceType() };

  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    // The column is varchar(1000) server-side; trim rather than get rejected.
    payload.userAgent = navigator.userAgent.slice(0, 1000);
  }

  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone) payload.timezone = timezone.slice(0, 64);
  } catch {
    // Intl is always present in supported browsers; if resolving the zone ever
    // fails we simply omit it and the server falls back to org settings.
  }

  return payload;
}
