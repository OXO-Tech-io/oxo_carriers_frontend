// Mirrors oxo_carriers_backend/src/modules/agent-activity response shapes.

// A `data` object from the OXO Activity Monitor Agent's `activity.log` WebSocket frame.
// mediaTitle is typed here only so the relay can drop it.
export interface AgentActivityFrameData {
  id: number;
  deviceId: string;
  eventType: string;
  startTs: string;
  appName?: string | null;
  windowTitle?: string | null;
  mouseEventCount?: number;
  keyEventCount?: number;
  mediaTitle?: string | null;
  mediaState?: string | null;
}

export interface AgentActivityFrame {
  type: string;
  ts: string;
  data: AgentActivityFrameData;
}

export interface AgentLogPayload {
  id: number;
  deviceId: string;
  eventType: string;
  startTs: string;
  appName: string | null;
  windowTitle: string | null;
  mouseEventCount: number;
  keyEventCount: number;
  mediaState: string | null;
}

export interface AgentActivityLog {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  deviceId: string;
  agentLogId: number;
  eventType: string;
  startTs: string;
  appName: string | null;
  windowTitle: string | null;
  mouseEventCount: number;
  keyEventCount: number;
  mediaState: string | null;
}

export interface AgentActivityLogsPage {
  total: number;
  logs: AgentActivityLog[];
}

export interface AgentActivitySummary {
  employeeId: string;
  firstName: string;
  lastName: string;
  deviceId: string;
  lastEventAt: string | null;
  eventCount: number;
  idleCount: number;
  windowCount: number;
}

export interface AgentActivityLogsParams {
  employeeId?: string;
  deviceId?: string;
  eventType?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}
