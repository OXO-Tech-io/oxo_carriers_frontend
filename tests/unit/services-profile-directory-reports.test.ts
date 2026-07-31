import { describe, it, expect, vi, beforeEach } from "vitest";
import { AxiosResponse } from "axios";
import api from "@/lib/api";
import { profileService } from "@/lib/services/profile.service";
import { userDirectoryService } from "@/lib/services/user-directory.service";
import { reportsService } from "@/lib/services/reports.service";

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

describe("profileService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getMyProfile maps the raw backend user through mapDbUserToAppUser", async () => {
    apiMock.get.mockResolvedValueOnce(
      asResponse({
        data: {
          id: 1,
          email: "a@a.com",
          firstName: "John",
          lastName: "Doe",
          role: "employee",
        },
      }),
    );
    const profile = await profileService.getMyProfile();
    expect(apiMock.get).toHaveBeenCalledWith("/auth/me");
    expect(profile).toMatchObject({ id: 1, first_name: "John", last_name: "Doe" });
  });

  it("getMyProfile returns null when there is no user", async () => {
    apiMock.get.mockResolvedValueOnce(asResponse({ data: null }));
    await expect(profileService.getMyProfile()).resolves.toBeNull();
  });

  it("covers education, work history and PII endpoints", async () => {
    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await profileService.getMyEducation();
    expect(apiMock.get).toHaveBeenCalledWith("/employee-education");

    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await profileService.getEducationForUser(5);
    expect(apiMock.get).toHaveBeenCalledWith("/employee-education", {
      params: { userId: 5 },
    });

    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await profileService.getMyWorkHistory();
    expect(apiMock.get).toHaveBeenCalledWith("/employee-work-history");

    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await profileService.getWorkHistoryForUser(5);
    expect(apiMock.get).toHaveBeenCalledWith("/employee-work-history", {
      params: { userId: 5 },
    });

    apiMock.get.mockResolvedValueOnce({
      data: { success: true, personalDetails: { nic: "123" } },
    } as AxiosResponse);
    await expect(profileService.getEmployeePersonalDetails(5)).resolves.toEqual({
      nic: "123",
    });
    expect(apiMock.get).toHaveBeenCalledWith("/users/5");
  });

  it("covers nominees, dependents, emergency contacts, welfare and experience summary", async () => {
    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await profileService.getNominees(5);
    expect(apiMock.get).toHaveBeenCalledWith("/employees/5/nominees");

    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await profileService.getDependents(5);
    expect(apiMock.get).toHaveBeenCalledWith("/employees/5/dependents");

    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await profileService.getEmergencyContacts(5);
    expect(apiMock.get).toHaveBeenCalledWith("/employees/5/emergency-contacts");

    apiMock.get.mockResolvedValueOnce(asResponse({ data: null }));
    await profileService.getWelfareInfo(5);
    expect(apiMock.get).toHaveBeenCalledWith("/employees/5/welfare-informations");

    apiMock.get.mockResolvedValueOnce(asResponse({ data: { totalYears: 3 } }));
    await profileService.getMyExperienceSummary();
    expect(apiMock.get).toHaveBeenCalledWith(
      "/employee-work-history/experience-summary",
    );

    apiMock.get.mockResolvedValueOnce(asResponse({ data: { totalYears: 3 } }));
    await profileService.getExperienceSummaryForUser(5);
    expect(apiMock.get).toHaveBeenCalledWith(
      "/employee-work-history/experience-summary",
      { params: { userId: 5 } },
    );
  });

  it("covers change-request listing and decisions", async () => {
    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await profileService.listChangeRequests({ status: "pending" });
    expect(apiMock.get).toHaveBeenCalledWith("/profile-change-requests", {
      params: { status: "pending" },
    });

    apiMock.get.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await profileService.getChangeRequestById(1);
    expect(apiMock.get).toHaveBeenCalledWith("/profile-change-requests/1");

    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await profileService.submitChangeRequest({ field: "email" } as any);
    expect(apiMock.post).toHaveBeenCalledWith("/profile-change-requests", {
      field: "email",
    });

    apiMock.put.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await profileService.approveChangeRequest(1, "looks good");
    expect(apiMock.put).toHaveBeenCalledWith(
      "/profile-change-requests/1/decisions",
      { decision: "approved", reviewerComments: "looks good" },
    );

    apiMock.put.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await profileService.rejectChangeRequest(1, "missing info");
    expect(apiMock.put).toHaveBeenCalledWith(
      "/profile-change-requests/1/decisions",
      { decision: "rejected", reviewerComments: "missing info" },
    );

    apiMock.put.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await profileService.returnChangeRequest(1, "please fix");
    expect(apiMock.put).toHaveBeenCalledWith(
      "/profile-change-requests/1/decisions",
      { decision: "returned_for_modification", reviewerComments: "please fix" },
    );
  });
});

describe("userDirectoryService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps and filters keycloak user rows into EmployeeSummary shapes", async () => {
    apiMock.get.mockResolvedValueOnce({
      data: {
        success: true,
        users: [
          {
            employee: {
              id: 1,
              email: "a@a.com",
              firstName: "John",
              lastName: "Doe",
              role: "employee",
              employeeId: "E1",
              department: "IT",
            },
          },
          { employee: null },
        ],
      },
    } as AxiosResponse);

    const result = await userDirectoryService.list({ search: "john" });

    expect(apiMock.get).toHaveBeenCalledWith("/users", {
      params: { search: "john" },
    });
    expect(result).toEqual([
      {
        id: 1,
        email: "a@a.com",
        first_name: "John",
        last_name: "Doe",
        employee_id: "E1",
        department: "IT",
        role: "employee",
      },
    ]);
  });

  it("defaults to an empty array when users is missing", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { success: true } } as AxiosResponse);
    await expect(userDirectoryService.list()).resolves.toEqual([]);
  });
});

describe("reportsService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getSubmissionsBreakdown and its excel export call the expected endpoint", async () => {
    apiMock.get.mockResolvedValueOnce({
      data: { success: true, summary: {}, formsBreakdown: [], communicationsBreakdown: [], userBreakdown: [] },
    } as AxiosResponse);
    await reportsService.getSubmissionsBreakdown({ department: "IT" });
    expect(apiMock.get).toHaveBeenCalledWith("/reports/submission-breakdowns", {
      params: { department: "IT" },
    });

    const blob = new Blob(["x"]);
    apiMock.get.mockResolvedValueOnce({ data: blob } as AxiosResponse);
    await expect(
      reportsService.downloadSubmissionsBreakdownExcel({ department: "IT" }),
    ).resolves.toBe(blob);
    expect(apiMock.get).toHaveBeenCalledWith("/reports/submission-breakdowns", {
      params: { department: "IT", format: "excel" },
      responseType: "blob",
    });
  });
});
