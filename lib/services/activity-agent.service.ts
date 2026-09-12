import { SessionAction } from '@/types/attendance';

// The OXO Activity Monitor Agent is a Windows background service running on the
// employee's own machine (see oxo-activity-monitor-agent repo). It listens on this
// local WebSocket endpoint so it can log HRIS clock-in/out and break events alongside
// its own idle/window activity log. It won't be running on every machine (e.g. non-
// Windows, or the agent not installed yet) - that's expected, so failures here must
// never surface to the user or affect the HRIS attendance flow itself.
const AGENT_WS_URL = 'ws://localhost:5959/agent/';
const SEND_TIMEOUT_MS = 2000;

export const activityAgentService = {
  /** Fire-and-forget notification to the local agent; never throws. */
  notify(action: SessionAction, employeeId?: string): void {
    try {
      const socket = new WebSocket(AGENT_WS_URL);

      const timeoutId = setTimeout(() => socket.close(), SEND_TIMEOUT_MS);

      socket.onopen = () => {
        clearTimeout(timeoutId);
        socket.send(JSON.stringify({ event: action, employeeId, timestamp: new Date().toISOString() }));
        socket.close();
      };

      // No agent listening on this machine - ignore silently.
      socket.onerror = () => clearTimeout(timeoutId);
    } catch {
      // WebSocket construction itself failing (e.g. unsupported environment) is also non-fatal.
    }
  },
};
