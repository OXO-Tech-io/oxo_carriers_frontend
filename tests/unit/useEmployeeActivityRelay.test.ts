import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const { useAuthMock, ingestMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  ingestMock: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: useAuthMock }));
vi.mock("@/lib/services/employee-activity.service", () => ({
  employeeActivityService: { ingest: ingestMock },
}));

import { useEmployeeActivityRelay } from "@/hooks/useEmployeeActivityRelay";

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  close = vi.fn(() => this.onclose?.());
  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }
  emit(frame: unknown) {
    this.onmessage?.({ data: typeof frame === "string" ? frame : JSON.stringify(frame) });
  }
}

const activityFrame = (overrides: Record<string, unknown> = {}) => ({
  type: "activity.log",
  ts: "2026-11-02T09:00:00.000Z",
  data: {
    id: 1,
    deviceId: "DEV-1",
    eventType: "window_focus",
    startTs: "2026-11-02T09:00:00.000Z",
    appName: "chrome.exe",
    windowTitle: "HRIS",
    mouseEventCount: 4,
    keyEventCount: 2,
    mediaTitle: "secret song",
    mediaState: "Playing",
    ...overrides,
  },
});

const flushTick = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
};

describe("useEmployeeActivityRelay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeWebSocket.instances = [];
    vi.stubGlobal("WebSocket", FakeWebSocket);
    useAuthMock.mockReturnValue({ user: { employee_id: "E1" } });
    ingestMock.mockResolvedValue({ received: 1, stored: 1, rejected: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("does not connect to the agent when the user has no employee id", () => {
    useAuthMock.mockReturnValue({ user: null });
    renderHook(() => useEmployeeActivityRelay());
    expect(FakeWebSocket.instances).toHaveLength(0);
  });

  it("connects to the local agent socket", () => {
    renderHook(() => useEmployeeActivityRelay());
    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(FakeWebSocket.instances[0].url).toBe("ws://localhost:5959/agent/");
  });

  it("batches activity.log frames and forwards them, dropping mediaTitle", async () => {
    renderHook(() => useEmployeeActivityRelay());
    const ws = FakeWebSocket.instances[0];

    ws.emit(activityFrame());
    ws.emit(activityFrame({ id: 2 }));
    expect(ingestMock).not.toHaveBeenCalled();

    await flushTick();

    expect(ingestMock).toHaveBeenCalledTimes(1);
    const batch = ingestMock.mock.calls[0][0];
    expect(batch).toHaveLength(2);
    expect(batch[0]).toEqual({
      id: 1,
      deviceId: "DEV-1",
      eventType: "window_focus",
      startTs: "2026-11-02T09:00:00.000Z",
      appName: "chrome.exe",
      windowTitle: "HRIS",
      mouseEventCount: 4,
      keyEventCount: 2,
      mediaState: "Playing",
    });
    expect(batch[0]).not.toHaveProperty("mediaTitle");
  });

  it("ignores frames that are not activity.log (e.g. screenshot.captured)", async () => {
    renderHook(() => useEmployeeActivityRelay());
    const ws = FakeWebSocket.instances[0];

    ws.emit({ type: "screenshot.captured", ts: "x", data: { eventId: 9, contentBase64: "AAAA" } });
    ws.emit({ type: "hris.event", ts: "x", data: {} });
    await flushTick();

    expect(ingestMock).not.toHaveBeenCalled();
  });

  it("ignores malformed and incomplete frames", async () => {
    renderHook(() => useEmployeeActivityRelay());
    const ws = FakeWebSocket.instances[0];

    ws.emit("not json");
    ws.emit(activityFrame({ deviceId: "" }));
    ws.emit(activityFrame({ id: "1" }));
    await flushTick();

    expect(ingestMock).not.toHaveBeenCalled();
  });

  it("keeps the batch and retries after a transient server error", async () => {
    ingestMock.mockRejectedValueOnce({ response: { status: 500 } });
    renderHook(() => useEmployeeActivityRelay());
    FakeWebSocket.instances[0].emit(activityFrame());

    await flushTick();
    expect(ingestMock).toHaveBeenCalledTimes(1);

    await flushTick();
    expect(ingestMock).toHaveBeenCalledTimes(2);
    expect(ingestMock.mock.calls[1][0]).toHaveLength(1);
  });

  it("stops relaying and closes the socket when the backend refuses (403)", async () => {
    ingestMock.mockRejectedValueOnce({ response: { status: 403 } });
    renderHook(() => useEmployeeActivityRelay());
    const ws = FakeWebSocket.instances[0];
    ws.emit(activityFrame());

    await flushTick();
    expect(ws.close).toHaveBeenCalled();

    // No reconnect after being refused.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(ingestMock).toHaveBeenCalledTimes(1);
  });

  it("reconnects with backoff when the agent socket closes", async () => {
    renderHook(() => useEmployeeActivityRelay());
    FakeWebSocket.instances[0].onclose?.();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(FakeWebSocket.instances).toHaveLength(2);
  });

  it("closes the socket and stops reconnecting on unmount", async () => {
    const { unmount } = renderHook(() => useEmployeeActivityRelay());
    const ws = FakeWebSocket.instances[0];

    unmount();
    expect(ws.close).toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(FakeWebSocket.instances).toHaveLength(1);
  });
});
