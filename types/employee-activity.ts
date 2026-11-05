// Mirrors oxo_carriers_backend/src/modules/employee-activity response shapes.

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
  /** The laptop that sent the frame (every agent message carries it). */
  deviceId?: string;
  data: AgentActivityFrameData;
}

// `screenshot.upload` frame: the agent hands the image to this tab before trying its own upload.
export interface AgentScreenshotFrameData {
  eventId: number;
  mimeType: string;
  fileName: string;
  capturedAt: string;
  dataBase64: string;
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

export interface EmployeeActivityLog {
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
  /** Set on `screenshot` events - fetch the image with employeeActivityService.getScreenshot. */
  screenshotId: number | null;
  /** Short-lived signed GCS URL for the image; null for legacy rows - then use getScreenshot. */
  screenshotUrl: string | null;
}

export interface EmployeeActivityLogsPage {
  total: number;
  logs: EmployeeActivityLog[];
}

export interface EmployeeActivitySummary {
  employeeId: string;
  firstName: string;
  lastName: string;
  deviceId: string;
  lastEventAt: string | null;
  eventCount: number;
  idleCount: number;
  windowCount: number;
}

export interface EmployeeActivityLogsParams {
  employeeId?: string;
  deviceId?: string;
  eventType?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}
