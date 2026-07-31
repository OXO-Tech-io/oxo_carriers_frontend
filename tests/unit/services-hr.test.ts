import { describe, it, expect, vi, beforeEach } from "vitest";
import { AxiosResponse } from "axios";
import api from "@/lib/api";
import { communicationService } from "@/lib/services/communication.service";
import { employeeNoteService } from "@/lib/services/employee-note.service";
import { eventService } from "@/lib/services/event.service";
import { groupService } from "@/lib/services/group.service";
import { notificationService } from "@/lib/services/notification.service";
import { workLogService } from "@/lib/services/work-log.service";
import { leaveCalendarService } from "@/lib/services/leave-calendar.service";

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

type ApiMock = {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const apiMock = api as unknown as ApiMock;
const asResponse = <T>(data: T) => ({ data }) as AxiosResponse<T>;

describe("communicationService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("create posts multipart form data with the recipients and files", async () => {
    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    const file = new File(["x"], "a.pdf");
    await communicationService.create(
      "Title",
      "Body",
      [1, 2],
      [3],
      [file],
      true,
      "2026-01-01",
    );

    expect(apiMock.post).toHaveBeenCalledWith(
      "/communications",
      expect.any(FormData),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    const formData = apiMock.post.mock.calls[0][1] as FormData;
    expect(formData.get("title")).toBe("Title");
    expect(formData.get("body")).toBe("Body");
    expect(formData.get("recipientUserIds")).toBe(JSON.stringify([1, 2]));
    expect(formData.get("recipientGroupIds")).toBe(JSON.stringify([3]));
    expect(formData.get("requiresAcknowledgement")).toBe("true");
    expect(formData.get("deadlineAt")).toBe("2026-01-01");
    expect(formData.get("attachments")).toBeInstanceOf(File);
  });

  it("listAll and listMine hit the expected endpoints", async () => {
    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await communicationService.listAll();
    expect(apiMock.get).toHaveBeenCalledWith("/communications");

    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await communicationService.listMine("E1");
    expect(apiMock.get).toHaveBeenCalledWith("/communications", {
      params: { employee_id: "E1" },
    });
  });

  it("respond, downloadReport and delete call expected endpoints", async () => {
    apiMock.post.mockResolvedValueOnce(asResponse({}));
    await communicationService.respond(1, "ack");
    expect(apiMock.post).toHaveBeenCalledWith("/communications/1/responses", {
      responseText: "ack",
    });

    const blob = new Blob(["x"]);
    apiMock.get.mockResolvedValueOnce({ data: blob } as AxiosResponse);
    await expect(communicationService.downloadReport()).resolves.toBe(blob);
    expect(apiMock.get).toHaveBeenCalledWith("/communications/reports", {
      responseType: "blob",
    });

    apiMock.delete.mockResolvedValueOnce(asResponse({}));
    await communicationService.delete(9);
    expect(apiMock.delete).toHaveBeenCalledWith("/communications/9");
  });
});

describe("employeeNoteService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("create posts multipart data for the employee", async () => {
    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    const file = new File(["x"], "note.pdf");
    await employeeNoteService.create(5, "content", [file]);

    expect(apiMock.post).toHaveBeenCalledWith(
      "/employee-notes",
      expect.any(FormData),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    const formData = apiMock.post.mock.calls[0][1] as FormData;
    expect(formData.get("employeeId")).toBe("5");
    expect(formData.get("content")).toBe("content");
  });

  it("listForEmployee and update call expected endpoints", async () => {
    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await employeeNoteService.listForEmployee(5);
    expect(apiMock.get).toHaveBeenCalledWith("/employee-notes/employees/5");

    apiMock.put.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await employeeNoteService.update(1, "updated");
    expect(apiMock.put).toHaveBeenCalledWith("/employee-notes/1", {
      content: "updated",
    });
  });
});

describe("eventService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("list, create, getWithParticipants and recordParticipation call expected endpoints", async () => {
    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await eventService.list();
    expect(apiMock.get).toHaveBeenCalledWith("/events");

    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await eventService.create({ name: "Party", eventDate: "2026-01-01" });
    expect(apiMock.post).toHaveBeenCalledWith("/events", {
      name: "Party",
      eventDate: "2026-01-01",
    });

    apiMock.get.mockResolvedValueOnce(
      asResponse({ data: { event: { id: 1 }, participants: [] } }),
    );
    await eventService.getWithParticipants(1);
    expect(apiMock.get).toHaveBeenCalledWith("/events/1");

    apiMock.post.mockResolvedValueOnce(asResponse({ data: [] }));
    await eventService.recordParticipation(1, [
      { userId: 2, participated: true },
    ]);
    expect(apiMock.post).toHaveBeenCalledWith("/events/1/participations", {
      participants: [{ userId: 2, participated: true }],
    });
  });
});

describe("groupService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("covers all CRUD and membership endpoints", async () => {
    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await groupService.list();
    expect(apiMock.get).toHaveBeenCalledWith("/groups");

    apiMock.get.mockResolvedValueOnce(asResponse({ data: { id: 1, members: [] } }));
    await groupService.getById(1);
    expect(apiMock.get).toHaveBeenCalledWith("/groups/1");

    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await groupService.create("Engineering");
    expect(apiMock.post).toHaveBeenCalledWith("/groups", { name: "Engineering" });

    apiMock.patch.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await groupService.rename(1, "Eng");
    expect(apiMock.patch).toHaveBeenCalledWith("/groups/1", { name: "Eng" });

    apiMock.delete.mockResolvedValueOnce(asResponse({}));
    await groupService.remove(1);
    expect(apiMock.delete).toHaveBeenCalledWith("/groups/1");

    apiMock.post.mockResolvedValueOnce(asResponse({}));
    await groupService.addMembers(1, [2, 3]);
    expect(apiMock.post).toHaveBeenCalledWith("/groups/1/members", {
      userIds: [2, 3],
    });

    apiMock.delete.mockResolvedValueOnce(asResponse({}));
    await groupService.removeMember(1, 2);
    expect(apiMock.delete).toHaveBeenCalledWith("/groups/1/members/2");
  });
});

describe("notificationService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("listMine, unreadCount, markRead, markAllRead call expected endpoints", async () => {
    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await notificationService.listMine({ isRead: false });
    expect(apiMock.get).toHaveBeenCalledWith("/notifications", {
      params: { isRead: false },
    });

    apiMock.get.mockResolvedValueOnce(asResponse({ data: { count: 3 } }));
    await expect(notificationService.unreadCount()).resolves.toBe(3);
    expect(apiMock.get).toHaveBeenCalledWith("/notifications/unread-count");

    apiMock.patch.mockResolvedValueOnce(asResponse({}));
    await notificationService.markRead(1);
    expect(apiMock.patch).toHaveBeenCalledWith("/notifications/1/read-status");

    apiMock.patch.mockResolvedValueOnce(asResponse({}));
    await notificationService.markAllRead();
    expect(apiMock.patch).toHaveBeenCalledWith("/notifications/read-statuses");
  });
});

describe("workLogService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("covers submit, listing, downloads, summary and bulk upload", async () => {
    apiMock.post.mockResolvedValueOnce(asResponse({ data: [] }));
    await workLogService.submit([{ date: "2026-01-01", hours: 8 } as any]);
    expect(apiMock.post).toHaveBeenCalledWith("/work-logs", {
      entries: [{ date: "2026-01-01", hours: 8 }],
    });

    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await workLogService.listMine({ from: "2026-01-01" });
    expect(apiMock.get).toHaveBeenCalledWith("/work-logs/mine", {
      params: { from: "2026-01-01" },
    });

    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await workLogService.listAll({ userId: 1 });
    expect(apiMock.get).toHaveBeenCalledWith("/work-logs", {
      params: { userId: 1 },
    });

    const templateBlob = new Blob(["t"]);
    apiMock.get.mockResolvedValueOnce({ data: templateBlob } as AxiosResponse);
    await expect(workLogService.downloadTemplate()).resolves.toBe(templateBlob);
    expect(apiMock.get).toHaveBeenCalledWith("/work-logs/template", {
      responseType: "blob",
    });

    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await workLogService.getSummary({ userId: 2 });
    expect(apiMock.get).toHaveBeenCalledWith("/work-logs/summary", {
      params: { userId: 2 },
    });

    const summaryBlob = new Blob(["s"]);
    apiMock.get.mockResolvedValueOnce({ data: summaryBlob } as AxiosResponse);
    await expect(
      workLogService.downloadSummaryReport({ userId: 2 }),
    ).resolves.toBe(summaryBlob);
    expect(apiMock.get).toHaveBeenCalledWith("/work-logs/reports/summary", {
      params: { userId: 2 },
      responseType: "blob",
    });

    const detailedBlob = new Blob(["d"]);
    apiMock.get.mockResolvedValueOnce({ data: detailedBlob } as AxiosResponse);
    await expect(
      workLogService.downloadDetailedReport({ userId: 2 }),
    ).resolves.toBe(detailedBlob);
    expect(apiMock.get).toHaveBeenCalledWith("/work-logs/reports/detailed", {
      params: { userId: 2 },
      responseType: "blob",
    });

    apiMock.post.mockResolvedValueOnce(asResponse({ data: { success: true } }));
    const file = new File(["x"], "logs.xlsx");
    await workLogService.bulkUpload(file);
    expect(apiMock.post).toHaveBeenCalledWith(
      "/work-logs/bulk-uploads",
      expect.any(FormData),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  });
});

describe("leaveCalendarService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getHolidaysInRange returns the data array, defaulting to empty", async () => {
    apiMock.get.mockResolvedValueOnce(asResponse({ data: [{ id: 1 }] }));
    await expect(
      leaveCalendarService.getHolidaysInRange("2026-01-01", "2026-12-31"),
    ).resolves.toEqual([{ id: 1 }]);

    apiMock.get.mockResolvedValueOnce({ data: {} } as AxiosResponse);
    await expect(
      leaveCalendarService.getHolidaysInRange("2026-01-01", "2026-12-31"),
    ).resolves.toEqual([]);
  });
});
