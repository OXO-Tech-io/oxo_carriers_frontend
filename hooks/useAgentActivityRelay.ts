'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { agentActivityService } from '@/lib/services/agent-activity.service';
import type { AgentActivityFrame, AgentLogPayload } from '@/types/agent-activity';

// The agent only listens on the employee's own machine, so this tab is the only thing
// that can reach it: stay connected to its local socket and forward each activity.log
// frame to the HRIS backend, which attributes it to the employee via their device ID.
// Absent/stopped agents are normal (non-Windows, not installed) - every failure here
// is silent and must never affect the rest of the app.
const AGENT_WS_URL = 'ws://localhost:5959/agent/';
const FLUSH_INTERVAL_MS = 5000;
const MAX_BATCH = 100;
const MAX_QUEUE = 500;
const MAX_RETRY_MS = 30_000;

// Forwards windowTitle (shown to admins) but deliberately drops mediaTitle.
const toPayload = (frame: AgentActivityFrame): AgentLogPayload | null => {
  const d = frame.data;
  if (!d || typeof d.id !== 'number' || !d.deviceId || !d.eventType || !d.startTs) return null;
  return {
    id: d.id,
    deviceId: d.deviceId,
    eventType: d.eventType,
    startTs: d.startTs,
    appName: d.appName ?? null,
    windowTitle: d.windowTitle ?? null,
    mouseEventCount: d.mouseEventCount ?? 0,
    keyEventCount: d.keyEventCount ?? 0,
    mediaState: d.mediaState ?? null,
  };
};

export function useAgentActivityRelay(): void {
  const { user } = useAuth();
  const employeeId = user?.employee_id;

  useEffect(() => {
    if (!employeeId || typeof WebSocket === 'undefined') return;

    let disposed = false;
    let stopped = false; // backend refused us (e.g. no device ID assigned) - stop retrying
    let socket: WebSocket | null = null;
    let retryMs = 1000;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let queue: AgentLogPayload[] = [];
    let flushing = false;

    const flush = async () => {
      if (flushing || stopped || queue.length === 0) return;
      flushing = true;
      const batch = queue.splice(0, MAX_BATCH);
      try {
        await agentActivityService.ingest(batch);
      } catch (error) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 403 || status === 400) {
          stopped = true;
          queue = [];
          socket?.close();
        } else {
          // Network/server hiccup: keep the batch for the next tick, bounded.
          queue = [...batch, ...queue].slice(-MAX_QUEUE);
        }
      } finally {
        flushing = false;
      }
    };

    const connect = () => {
      if (disposed || stopped) return;
      try {
        socket = new WebSocket(AGENT_WS_URL);
      } catch {
        return;
      }
      socket.onopen = () => {
        retryMs = 1000;
      };
      socket.onmessage = (event) => {
        try {
          const frame = JSON.parse(String(event.data)) as AgentActivityFrame;
          if (frame.type !== 'activity.log') return;
          const payload = toPayload(frame);
          if (payload) queue = [...queue, payload].slice(-MAX_QUEUE);
        } catch {
          // Ignore malformed frames.
        }
      };
      socket.onerror = () => socket?.close();
      socket.onclose = () => {
        if (disposed || stopped) return;
        retryTimer = setTimeout(connect, retryMs);
        retryMs = Math.min(retryMs * 2, MAX_RETRY_MS);
      };
    };

    connect();
    const flushTimer = setInterval(() => void flush(), FLUSH_INTERVAL_MS);

    return () => {
      disposed = true;
      clearInterval(flushTimer);
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
    };
  }, [employeeId]);
}
