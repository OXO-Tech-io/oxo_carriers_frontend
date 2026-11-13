import { describe, it, expect, vi, beforeEach } from "vitest";

const { getMock, postMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  default: { get: getMock, post: postMock },
}));

import { employeeActivityService } from "@/lib/services/employee-activity.service";

describe("employeeActivityService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ingest posts the relayed logs to /employee-activities/logs and unwraps data", async () => {
    postMock.mockResolvedValue({
      data: { success: true, data: { received: 2, stored: 2, rejected: 0 } },
    });
    const logs = [
      {
        id: 1,
        deviceId: "DEV-1",
        eventType: "heartbeat",
        startTs: "2026-11-02T09:00:00.000Z",
        appName: null,
        windowTitle: null,
        mouseEventCount: 0,
        keyEventCount: 0,
        mediaState: null,
      },
    ];

    const result = await employeeActivityService.ingest(logs);

    expect(postMock).toHaveBeenCalledWith("/employee-activities/logs", { logs });
    expect(result).toEqual({ received: 2, stored: 2, rejected: 0 });
  });

  it("getLogs requests /employee-activities/logs with the filters as query params", async () => {
    const page = { total: 1, logs: [{ id: 5 }] };
    getMock.mockResolvedValue({ data: { success: true, data: page } });
    const params = { employeeId: "E1", eventType: "idle_start", limit: 25, offset: 50 };

    const result = await employeeActivityService.getLogs(params);

    expect(getMock).toHaveBeenCalledWith("/employee-activities/logs", { params });
    expect(result).toEqual(page);
  });

  it("getLogs defaults to no params", async () => {
    getMock.mockResolvedValue({ data: { data: { total: 0, logs: [] } } });

    await employeeActivityService.getLogs();

    expect(getMock).toHaveBeenCalledWith("/employee-activities/logs", { params: {} });
  });

  it("getSummary requests /employee-activities/summaries with the date range", async () => {
    const summaries = [{ employeeId: "E1", eventCount: 3 }];
    getMock.mockResolvedValue({ data: { success: true, data: summaries } });

    const result = await employeeActivityService.getSummary({ from: "2026-11-01", to: "2026-11-02" });

    expect(getMock).toHaveBeenCalledWith("/employee-activities/summaries", {
      params: { from: "2026-11-01", to: "2026-11-02" },
    });
    expect(result).toEqual(summaries);
  });

  it("does not call the old /agent-activity routes", async () => {
    getMock.mockResolvedValue({ data: { data: [] } });
    postMock.mockResolvedValue({ data: { data: {} } });

    await employeeActivityService.getSummary();
    await employeeActivityService.getLogs();
    await employeeActivityService.ingest([]);

    const urls = [...getMock.mock.calls, ...postMock.mock.calls].map((c) => c[0] as string);
    expect(urls.every((u) => u.startsWith("/employee-activities/"))).toBe(true);
  });

  it("propagates API errors to the caller", async () => {
    getMock.mockRejectedValue(new Error("Network Error"));

    await expect(employeeActivityService.getLogs()).rejects.toThrow("Network Error");
  });
});
