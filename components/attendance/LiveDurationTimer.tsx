'use client';

import { useEffect, useState } from 'react';
import { formatHms } from '@/lib/attendance/format';

interface LiveDurationTimerProps {
  /** ISO timestamp the clock counts up from. `null` renders a dash. */
  startedAt: string | null;
  /** Freeze the display, e.g. once the session has ended. */
  paused?: boolean;
  /** Seconds already banked before `startedAt`, for multi-session days. */
  baseSeconds?: number;
  className?: string;
}

/**
 * HH:MM:SS counting up from a fixed start timestamp. The interval lives here so
 * only this leaf re-renders once a second, never the page around it.
 */
export function LiveDurationTimer({
  startedAt,
  paused = false,
  baseSeconds = 0,
  className = '',
}: LiveDurationTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt || paused) return;
    const startMs = new Date(startedAt).getTime();
    if (Number.isNaN(startMs)) return;

    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt, paused]);

  if (!startedAt) {
    return <span className={`font-mono tabular-nums ${className}`}>--:--:--</span>;
  }

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {formatHms(baseSeconds + elapsed)}
    </span>
  );
}
