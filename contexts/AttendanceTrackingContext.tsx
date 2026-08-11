'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useAuthStore } from '@/store/authStore';
import { API_BASE_URL } from '@/lib/api';
import { attendanceService } from '@/lib/services/attendance.service';
import {
  useEndSessionMutation,
  useForceTerminateMutation,
  useHeartbeatMutation,
  useRecordActivityBatchMutation,
  useStartSessionMutation,
} from '@/hooks/mutations/use-attendance-mutations';
import { collectSessionMetadata } from '@/lib/attendance/collectSessionMetadata';
import {
  ATTENDANCE_SESSION_TOKEN_KEY,
  endSessionBeacon,
} from '@/lib/attendance/endSessionBeacon';
import type {
  ActiveSessionConflictDetails,
  ActivityEventPayload,
  ActivityEventType,
} from '@/types/attendance';

/** Well under the server's default 90s heartbeatGraceSec. */
const FLUSH_INTERVAL_MS = 30_000;
/** One counted mouse_move per this many ms, not one per DOM event. */
const MOUSE_MOVE_THROTTLE_MS = 200;
/** Server rejects batches larger than this. */
const MAX_EVENTS_PER_BATCH = 500;

/** Stored statuses that mean "this session is still running". */
const OPEN_SESSION_STATUSES = ['active', 'idle', 'disconnected'];

export type TrackingStatus = 'active' | 'idle' | 'offline';

export type SessionConflict = ActiveSessionConflictDetails['session'];

export type ConflictResolution = 'continue' | 'cancel';

interface AttendanceTrackingValue {
  /** Authoritative status, only ever set from a server response. */
  status: TrackingStatus;
  sessionToken: string | null;
  /** Non-null when session/start returned 409; drives the conflict modal. */
  conflict: SessionConflict | null;
  resolveConflict: (action: ConflictResolution) => void;
  isResolvingConflict: boolean;
  /** Manual "Clock In" - opens a session the same way auto-start does. */
  clockIn: () => Promise<void>;
  /** Manual "Clock Out" - explicit end-session call, not the unload beacon. */
  clockOut: () => Promise<void>;
  isStartingSession: boolean;
  isEndingSession: boolean;
}

const AttendanceTrackingContext = createContext<AttendanceTrackingValue | null>(null);

/** Pull `details` off an axios 409 without pulling axios types into scope. */
function readConflictDetails(error: unknown): SessionConflict | null {
  const details = (
    error as { response?: { data?: { details?: ActiveSessionConflictDetails } } } | null
  )?.response?.data?.details;
  if (details?.code === 'active_session_exists' && details.session) return details.session;
  return null;
}

const readStatusCode = (error: unknown): number | undefined =>
  (error as { response?: { status?: number } } | null)?.response?.status;

/**
 * Owns the whole work-session lifecycle for the tab: starting a session when
 * the user signs in, then heartbeating, sampling activity and reporting it
 * until they sign out.
 *
 * Start and tracking live in one provider on purpose - split across two, both
 * halves would race on the same `sessionStorage` key and a fast second mount
 * could open two sessions.
 *
 * The client never decides it is idle. It only reports raw activity counts;
 * the heartbeat response carries the server's verdict, which is what `status`
 * exposes.
 */
export function AttendanceProvider({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const toast = useToast();

  const [trackedStatus, setStatus] = useState<TrackingStatus>('offline');
  const [trackedToken, setSessionToken] = useState<string | null>(null);
  const [pendingConflict, setConflict] = useState<SessionConflict | null>(null);
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);

  // Signing out invalidates all three at once. Deriving them from the token
  // rather than resetting them in an effect keeps the sign-out path free of a
  // cascading render, and means no consumer can ever observe a live session
  // while unauthenticated.
  const sessionToken = accessToken ? trackedToken : null;
  const status: TrackingStatus = accessToken ? trackedStatus : 'offline';
  const conflict = accessToken ? pendingConflict : null;

  const startSession = useStartSessionMutation();
  const heartbeat = useHeartbeatMutation();
  const recordActivity = useRecordActivityBatchMutation();
  const forceTerminate = useForceTerminateMutation();
  const endSession = useEndSessionMutation();

  // Raw DOM event counts accumulate in a ref, never in state: at ~5 events/sec
  // a state update per event would re-render the entire app tree. State only
  // changes when the server answers a heartbeat, i.e. about once per 30s.
  const countsRef = useRef<Partial<Record<ActivityEventType, number>>>({});
  const lastMouseMoveAtRef = useRef(0);
  // Seeded in the tracking effect, not here: reading the clock during render
  // would make the component non-idempotent.
  const bucketStartRef = useRef(0);

  // Long-lived listeners and the flush interval close over these rather than
  // over render-scope values, so the tracking effect depends only on the
  // session token and never tears itself down mid-session.
  const apiRef = useRef({
    start: startSession.mutateAsync,
    heartbeat: heartbeat.mutateAsync,
    recordActivity: recordActivity.mutateAsync,
    forceTerminate: forceTerminate.mutateAsync,
    end: endSession.mutateAsync,
  });
  const toastRef = useRef(toast);
  // Guards against two bootstraps racing to open a session - React's
  // development double-mount runs the effect twice, and both passes would
  // otherwise see an empty sessionStorage and each POST a start.
  const bootstrappingRef = useRef(false);

  useEffect(() => {
    apiRef.current = {
      start: startSession.mutateAsync,
      heartbeat: heartbeat.mutateAsync,
      recordActivity: recordActivity.mutateAsync,
      forceTerminate: forceTerminate.mutateAsync,
      end: endSession.mutateAsync,
    };
    toastRef.current = toast;
  });

  /** Forget this tab's session without touching the server. */
  const clearLocalSession = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(ATTENDANCE_SESSION_TOKEN_KEY);
    }
    setSessionToken(null);
    setStatus('offline');
  }, []);

  const adoptSession = useCallback((token: string, sessionStatus: string) => {
    sessionStorage.setItem(ATTENDANCE_SESSION_TOKEN_KEY, token);
    setSessionToken(token);
    setStatus(sessionStatus === 'idle' ? 'idle' : 'active');
  }, []);

  /**
   * Open a session, or surface the 409 for the conflict modal. Anything else
   * is logged and swallowed - attendance tracking must never block the app.
   */
  const beginSession = useCallback(async (): Promise<void> => {
    try {
      const session = await apiRef.current.start(collectSessionMetadata());
      adoptSession(session.sessionToken, session.status);
      setConflict(null);
      toastRef.current.success('Work session started successfully.');
    } catch (error) {
      const details = readConflictDetails(error);
      if (details) {
        // Expected flow, not a failure - the modal asks which session wins.
        setConflict(details);
        return;
      }
      console.error('[Attendance] Failed to start work session:', error);
    }
  }, [adoptSession]);

  // ─── Session bootstrap ─────────────────────────────────────────────────────
  useEffect(() => {
    // Signed out: nothing to bootstrap. The exposed values are already derived
    // back to their empty state above, and the session token itself is removed
    // by endSessionBeacon() inside authStore.logout().
    if (!accessToken) return;

    let cancelled = false;

    const bootstrap = async () => {
      const existing = sessionStorage.getItem(ATTENDANCE_SESSION_TOKEN_KEY);
      if (existing) {
        setSessionToken(existing);
        setStatus((current) => (current === 'offline' ? 'active' : current));
        return;
      }

      if (bootstrappingRef.current) return;
      bootstrappingRef.current = true;

      try {
        // sessionStorage is per-tab, so a second tab - or a reload after the
        // user cleared storage - has no token even though the server still
        // holds an open session. Adopting that session is strictly better than
        // starting blind: a blind start would 409 and pop the conflict modal at
        // the user for a session that is really their own, in this same browser.
        try {
          const mine = await attendanceService.getMySession();
          if (mine?.sessionToken && OPEN_SESSION_STATUSES.includes(mine.status)) {
            adoptSession(mine.sessionToken, mine.status);
            return;
          }
        } catch (error) {
          // A failed lookup (network blip, a transient 5xx) must not leave the
          // employee clocked out for the rest of the tab's life - fall through
          // to opening a fresh session instead of giving up silently. Worst
          // case start() 409s and the conflict modal offers a way out.
          console.error('[Attendance] Failed to look up the current work session:', error);
        }

        if (cancelled) return;
        await beginSession();
      } finally {
        bootstrappingRef.current = false;
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [accessToken, adoptSession, beginSession]);

  // ─── Activity sampling + heartbeat ─────────────────────────────────────────
  useEffect(() => {
    if (!sessionToken || typeof window === 'undefined') return;

    let disposed = false;
    bucketStartRef.current = Date.now();

    const bump = (type: ActivityEventType) => {
      countsRef.current[type] = (countsRef.current[type] ?? 0) + 1;
    };

    const onMouseMove = () => {
      const now = Date.now();
      if (now - lastMouseMoveAtRef.current < MOUSE_MOVE_THROTTLE_MS) return;
      lastMouseMoveAtRef.current = now;
      bump('mouse_move');
    };
    const onClick = () => bump('click');
    // Counted only. The key itself is never read, let alone transmitted.
    const onKeyDown = () => bump('keypress');
    const onScroll = () => bump('scroll');
    const onFocus = () => bump('focus');
    const onBlur = () => bump('blur');

    /** Drain the counters into one bucket's worth of events. */
    const drain = (): ActivityEventPayload[] => {
      const counts = countsRef.current;
      countsRef.current = {};
      const bucketStart = new Date(bucketStartRef.current).toISOString();
      bucketStartRef.current = Date.now();

      return (Object.keys(counts) as ActivityEventType[])
        .filter((type) => (counts[type] ?? 0) > 0)
        .map((type) => ({ eventType: type, eventCount: counts[type], bucketStart }));
    };

    const flush = async () => {
      const events = drain();

      try {
        const result = await apiRef.current.heartbeat(sessionToken);
        if (disposed) return;
        setStatus(result.status === 'idle' ? 'idle' : 'active');
      } catch (error) {
        const code = readStatusCode(error);
        // 404 unknown token / 403 wrong owner / 409 already closed all mean this
        // tab's token is dead. Drop it rather than retry forever; the next full
        // page load opens a fresh session.
        if (code === 404 || code === 403 || code === 409) {
          clearLocalSession();
          return;
        }
        console.error('[Attendance] Heartbeat failed:', error);
        return;
      }

      if (!events.length || disposed) return;

      // One bucket produces at most one event per type, far below the server's
      // 500-event cap, but chunk anyway so this can never be the thing that
      // breaks if the sampling model changes.
      for (let i = 0; i < events.length; i += MAX_EVENTS_PER_BATCH) {
        try {
          await apiRef.current.recordActivity({
            sessionToken,
            events: events.slice(i, i + MAX_EVENTS_PER_BATCH),
          });
        } catch (error) {
          // A dropped activity batch costs a little accuracy in the idle split;
          // it must not kill the heartbeat loop.
          console.error('[Attendance] Failed to record activity batch:', error);
          return;
        }
      }
    };

    const onVisibilityChange = () => {
      bump('visibility_change');
      // Hiding the tab is the last reliable moment before a background throttle
      // stretches the interval, so push what we have instead of waiting.
      if (document.visibilityState === 'hidden') void flush();
    };

    const onPageHide = () => endSessionBeacon(API_BASE_URL);

    const passive = { passive: true } as const;
    document.addEventListener('mousemove', onMouseMove, passive);
    document.addEventListener('click', onClick, passive);
    document.addEventListener('keydown', onKeyDown, passive);
    document.addEventListener('scroll', onScroll, passive);
    document.addEventListener('visibilitychange', onVisibilityChange, passive);
    window.addEventListener('focus', onFocus, passive);
    window.addEventListener('blur', onBlur, passive);
    window.addEventListener('pagehide', onPageHide, passive);

    const timer = window.setInterval(() => void flush(), FLUSH_INTERVAL_MS);

    return () => {
      disposed = true;
      window.clearInterval(timer);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [sessionToken, clearLocalSession]);

  // ─── Conflict resolution ───────────────────────────────────────────────────
  const resolveConflict = useCallback(
    (action: ConflictResolution) => {
      if (action === 'cancel') {
        // Keep using the other session; this tab simply does not track.
        setConflict(null);
        return;
      }

      const conflicting = conflict;
      if (!conflicting) return;

      setIsResolvingConflict(true);
      void (async () => {
        try {
          await apiRef.current.forceTerminate(conflicting.id);
          setConflict(null);
          await beginSession();
        } catch (error) {
          console.error('[Attendance] Failed to take over the existing session:', error);
          toastRef.current.error(
            'Could not continue here',
            'The previous work session could not be closed. Please try again.',
          );
        } finally {
          setIsResolvingConflict(false);
        }
      })();
    },
    [conflict, beginSession],
  );

  /** Manual "Clock In" button - same open-a-session path the auto-bootstrap uses. */
  const clockIn = useCallback(async () => {
    if (sessionToken) return;
    await beginSession();
  }, [sessionToken, beginSession]);

  /** Manual "Clock Out" button - explicit end-session call, not the unload beacon. */
  const clockOut = useCallback(async () => {
    if (!sessionToken) return;
    try {
      await apiRef.current.end(sessionToken);
      clearLocalSession();
      toastRef.current.success('Work session ended successfully.');
    } catch (error) {
      console.error('[Attendance] Failed to end work session:', error);
      toastRef.current.error(
        'Could not clock out',
        'Your work session could not be ended. Please try again.',
      );
    }
  }, [sessionToken, clearLocalSession]);

  // Memoised so the ~1-per-30s status change is the only thing that re-renders
  // every consumer of this context.
  const value = useMemo(
    () => ({
      status,
      sessionToken,
      conflict,
      resolveConflict,
      isResolvingConflict,
      clockIn,
      clockOut,
      isStartingSession: startSession.isPending,
      isEndingSession: endSession.isPending,
    }),
    [
      status,
      sessionToken,
      conflict,
      resolveConflict,
      isResolvingConflict,
      clockIn,
      clockOut,
      startSession.isPending,
      endSession.isPending,
    ],
  );

  return (
    <AttendanceTrackingContext.Provider value={value}>
      {children}
    </AttendanceTrackingContext.Provider>
  );
}

export function useAttendanceTracking(): AttendanceTrackingValue {
  const context = useContext(AttendanceTrackingContext);
  if (!context) {
    throw new Error('useAttendanceTracking must be used within an <AttendanceProvider>');
  }
  return context;
}
