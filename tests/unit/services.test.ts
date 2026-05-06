import { describe, it, expect, vi, beforeEach } from "vitest";
import { AxiosResponse } from "axios";
import api from "@/lib/api";
import { extractData, extractMessage } from "@/lib/services/http";
import { authService } from "@/lib/services/auth.service";
import { userService } from "@/lib/services/user.service";
import { facilityService } from "@/lib/services/facility.service";
import { voucherService } from "@/lib/services/voucher.service";
import { salaryService } from "@/lib/services/salary.service";
import { medicalInsuranceService } from "@/lib/services/medical-insurance.service";
import { consultantSubmissionService } from "@/lib/services/consultant-submission.service";
import { leaveCalendarAdminService } from "@/lib/services/leave-calendar-admin.service";
import { reportsService } from "@/lib/services/reports.service";
import { emailService } from "@/lib/services/email.service";
import { leaveService } from "@/lib/services/leave.service";
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

describe("frontend services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extractData handles envelope and raw payload", () => {
    expect(
      extractData(asResponse({ data: 10, success: true, message: "ok" })),
    ).toBe(10);
    expect(extractData(asResponse(["a", "b"]))).toEqual(["a", "b"]);
  });

  it("extractMessage returns message when present", () => {
    expect(extractMessage(asResponse({ message: "hello" }))).toBe("hello");
    expect(extractMessage(asResponse({ foo: "bar" }))).toBeUndefined();
  });

  it("authService methods call expected endpoints", async () => {
    apiMock.post.mockResolvedValueOnce(
      asResponse({ token: "t1", user: { id: 1 } }),
    );
    await expect(
      authService.login({ email: "a@a.com", password: "x" }),
    ).resolves.toEqual({ token: "t1", user: { id: 1 } });

    apiMock.get.mockResolvedValueOnce(asResponse({ user: { id: 2 } }));
    await expect(authService.getCurrentUser()).resolves.toEqual({ id: 2 });

    apiMock.post.mockResolvedValueOnce(asResponse({ success: true }));
    await authService.register({
      first_name: "A",
      last_name: "B",
      email: "a@a.com",
      employee_id: "E1",
      position: "Dev",
      department: "IT",
      hire_date: "2026-01-01",
    });

    apiMock.get.mockResolvedValueOnce(asResponse({ success: true }));
    await authService.verifyEmail("abc");

    apiMock.post.mockResolvedValueOnce(asResponse({ success: true }));
    await authService.resetPassword("abc", "Password1");

    apiMock.post.mockResolvedValueOnce(asResponse({ success: true }));
    await authService.changePassword("old", "new");

    expect(apiMock.post).toHaveBeenCalledWith("/auth/login", {
      email: "a@a.com",
      password: "x",
    });
    expect(apiMock.get).toHaveBeenCalledWith("/auth/me");
    expect(apiMock.post).toHaveBeenCalledWith(
      "/auth/register",
      expect.any(Object),
    );
    expect(apiMock.get).toHaveBeenCalledWith("/auth/verify-email?token=abc");
    expect(apiMock.post).toHaveBeenCalledWith("/auth/reset-password", {
      token: "abc",
      password: "Password1",
    });
    expect(apiMock.post).toHaveBeenCalledWith("/auth/change-password", {
      currentPassword: "old",
      newPassword: "new",
    });
  });

  it("userService methods call expected endpoints", async () => {
    apiMock.get.mockResolvedValueOnce(asResponse({ data: { users: [] } }));
    await userService.listUsers({ page: 1 });

    apiMock.get.mockResolvedValueOnce(asResponse({ data: { vendors: [] } }));
    await userService.listVendors({ page: 1 });

    apiMock.get.mockResolvedValueOnce(asResponse({ data: ["IT"] }));
    await userService.listDepartments();

    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await userService.createUser(new FormData());

    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 2 } }));
    await userService.createVendor({ company_name: "X", email: "x@x.com" });

    apiMock.post.mockResolvedValueOnce(asResponse({ success: true }));
    await userService.resetUserPassword(9);

    apiMock.delete.mockResolvedValueOnce(asResponse({}));
    await userService.deleteUser(5);

    apiMock.patch.mockResolvedValueOnce(asResponse({}));
    await userService.updateUserRole(4, "employee");

    expect(apiMock.get).toHaveBeenCalledWith("/users", { params: { page: 1 } });
    expect(apiMock.get).toHaveBeenCalledWith("/vendors", {
      params: { page: 1 },
    });
    expect(apiMock.get).toHaveBeenCalledWith("/users/departments");
    expect(apiMock.post).toHaveBeenCalledWith("/users", expect.any(FormData));
    expect(apiMock.post).toHaveBeenCalledWith("/vendors", {
      company_name: "X",
      email: "x@x.com",
    });
    expect(apiMock.post).toHaveBeenCalledWith("/users/9/reset-password");
    expect(apiMock.delete).toHaveBeenCalledWith("/users/5");
    expect(apiMock.patch).toHaveBeenCalledWith("/users/4/role", {
      role: "employee",
    });
  });

  it("facilityService methods call expected endpoints", async () => {
    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await facilityService.listFacilities();

    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await facilityService.createFacility({
      name: "Room",
      type: "meeting_room",
    });

    apiMock.put.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await facilityService.updateFacility(1, {
      name: "Room 2",
      type: "meeting_room",
    });

    apiMock.delete.mockResolvedValueOnce(asResponse({}));
    await facilityService.deleteFacility(1);

    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await facilityService.getAvailableFacilities({
      start_time: "s",
      end_time: "e",
    });

    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 2 } }));
    await facilityService.createBooking({
      facility_id: 1,
      start_time: "s",
      end_time: "e",
    });

    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await facilityService.getMyBookings();

    apiMock.put.mockResolvedValueOnce(asResponse({}));
    await facilityService.cancelBooking(2);

    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await facilityService.getAllBookings({
      start_date: "a",
      end_date: "b",
      facility_id: 1,
    });

    expect(apiMock.get).toHaveBeenCalledWith("/facilities");
    expect(apiMock.post).toHaveBeenCalledWith("/facilities", {
      name: "Room",
      type: "meeting_room",
    });
    expect(apiMock.put).toHaveBeenCalledWith("/facilities/1", {
      name: "Room 2",
      type: "meeting_room",
    });
    expect(apiMock.delete).toHaveBeenCalledWith("/facilities/1");
    expect(apiMock.get).toHaveBeenCalledWith("/facilities/available", {
      params: { start_time: "s", end_time: "e" },
    });
    expect(apiMock.post).toHaveBeenCalledWith("/facilities/book", {
      facility_id: 1,
      start_time: "s",
      end_time: "e",
    });
    expect(apiMock.get).toHaveBeenCalledWith("/facilities/my-bookings");
    expect(apiMock.put).toHaveBeenCalledWith("/facilities/bookings/2/cancel");
    expect(apiMock.get).toHaveBeenCalledWith("/facilities/all-bookings", {
      params: { start_date: "a", end_date: "b", facility_id: 1 },
    });
  });

  it("voucherService methods call expected endpoints", async () => {
    apiMock.get.mockResolvedValueOnce(asResponse({ data: { vouchers: [] } }));
    await voucherService.listVouchers({ page: 1 });

    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await voucherService.listServiceProviders();

    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await voucherService.createVoucher({ vendor_id: 1, amount: 100 });

    apiMock.put.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await voucherService.reviewVoucher(1, { action: "approve" });

    apiMock.put.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await voucherService.resubmitVoucher(1);

    apiMock.put.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await voucherService.markVoucherBankUploaded(1);

    apiMock.put.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await voucherService.markVoucherPaid(1);

    expect(apiMock.get).toHaveBeenCalledWith("/vouchers", {
      params: { page: 1 },
    });
    expect(apiMock.get).toHaveBeenCalledWith("/vouchers/service-providers");
    expect(apiMock.post).toHaveBeenCalledWith("/vouchers", {
      vendor_id: 1,
      amount: 100,
    });
    expect(apiMock.put).toHaveBeenCalledWith("/vouchers/1/review", {
      action: "approve",
    });
    expect(apiMock.put).toHaveBeenCalledWith("/vouchers/1/resubmit");
    expect(apiMock.put).toHaveBeenCalledWith("/vouchers/1/bank-upload");
    expect(apiMock.put).toHaveBeenCalledWith("/vouchers/1/paid");
  });

  it("salaryService methods call expected endpoints", async () => {
    apiMock.post.mockResolvedValueOnce(asResponse({ success: true }));
    await salaryService.bulkUpload(new FormData());

    apiMock.get.mockResolvedValueOnce(asResponse({ data: { salaries: [] } }));
    await salaryService.listSalaries(2026);

    apiMock.get.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await salaryService.getSalaryById(1);

    apiMock.get.mockResolvedValueOnce(asResponse({ data: { year: 2026 } }));
    await salaryService.getSalaryYtd(2026);

    const blob = new Blob(["x"]);
    apiMock.get.mockResolvedValueOnce(asResponse(blob));
    await expect(salaryService.downloadSalaryPdf(1)).resolves.toBe(blob);

    expect(apiMock.post).toHaveBeenCalledWith(
      "/salary/bulk-upload",
      expect.any(FormData),
    );
    expect(apiMock.get).toHaveBeenCalledWith("/salary", {
      params: { year: 2026 },
    });
    expect(apiMock.get).toHaveBeenCalledWith("/salary/1");
    expect(apiMock.get).toHaveBeenCalledWith("/salary/ytd", {
      params: { year: 2026 },
    });
    expect(apiMock.get).toHaveBeenCalledWith("/salary/1/pdf", {
      responseType: "blob",
    });
  });

  it("medicalInsuranceService methods call expected endpoints", async () => {
    apiMock.get.mockResolvedValueOnce(asResponse({ data: { claims: [] } }));
    await medicalInsuranceService.listClaims({ page: 1 });

    apiMock.get.mockResolvedValueOnce(
      asResponse({ data: { annual_limit: 1000 } }),
    );
    await medicalInsuranceService.getLimits();

    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await medicalInsuranceService.createClaim(new FormData());

    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await medicalInsuranceService.resubmitClaim(1, new FormData());

    apiMock.put.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await medicalInsuranceService.approveClaim(1);

    apiMock.put.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await medicalInsuranceService.rejectClaim(1, "missing docs");

    expect(apiMock.get).toHaveBeenCalledWith("/medical-insurance", {
      params: { page: 1 },
    });
    expect(apiMock.get).toHaveBeenCalledWith("/medical-insurance/limits");
    expect(apiMock.post).toHaveBeenCalledWith(
      "/medical-insurance",
      expect.any(FormData),
    );
    expect(apiMock.post).toHaveBeenCalledWith(
      "/medical-insurance/1/resubmit",
      expect.any(FormData),
    );
    expect(apiMock.put).toHaveBeenCalledWith("/medical-insurance/1/approve");
    expect(apiMock.put).toHaveBeenCalledWith("/medical-insurance/1/reject", {
      admin_comment: "missing docs",
    });
  });

  it("consultantSubmissionService methods call expected endpoints", async () => {
    apiMock.get.mockResolvedValueOnce(
      asResponse({ data: { submissions: [] } }),
    );
    await consultantSubmissionService.listSubmissions({ page: 1 });

    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await consultantSubmissionService.createSubmission(new FormData());

    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await consultantSubmissionService.resubmitSubmission(1, new FormData());

    apiMock.put.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await consultantSubmissionService.approveSubmission(1);

    apiMock.put.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await consultantSubmissionService.rejectSubmission(1, "fix hours");

    expect(apiMock.get).toHaveBeenCalledWith("/consultant-submissions", {
      params: { page: 1 },
    });
    expect(apiMock.post).toHaveBeenCalledWith(
      "/consultant-submissions",
      expect.any(FormData),
    );
    expect(apiMock.post).toHaveBeenCalledWith(
      "/consultant-submissions/1/resubmit",
      expect.any(FormData),
    );
    expect(apiMock.put).toHaveBeenCalledWith(
      "/consultant-submissions/1/approve",
    );
    expect(apiMock.put).toHaveBeenCalledWith(
      "/consultant-submissions/1/reject",
      { admin_comment: "fix hours" },
    );
  });

  it("leave calendar admin and leave services call expected endpoints", async () => {
    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await leaveCalendarAdminService.listByYear(2026);

    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await leaveCalendarAdminService.createEntry({
      date: "2026-01-01",
      name: "Holiday",
    });

    apiMock.put.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await leaveCalendarAdminService.updateEntry(1, {
      date: "2026-01-02",
      name: "Holiday 2",
    });

    apiMock.delete.mockResolvedValueOnce(asResponse({}));
    await leaveCalendarAdminService.deleteEntry(1);

    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await leaveService.getLeaveTypes();

    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await leaveService.getLeaveBalance(2026);

    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await leaveService.listLeaveRequests({ status: "pending" });

    apiMock.get.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await leaveService.getLeaveRequestById(1);

    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await leaveService.createLeaveRequest(new FormData());

    apiMock.put.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await leaveService.approveLeaveRequest(1, { approvedBy: "hr" });

    apiMock.put.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await leaveService.rejectLeaveRequest(1, { rejectionReason: "x" });

    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await leaveCalendarService.getHolidaysInRange("2026-01-01", "2026-12-31");

    expect(apiMock.get).toHaveBeenCalledWith("/leave-calendar", {
      params: { year: 2026 },
    });
    expect(apiMock.post).toHaveBeenCalledWith("/leave-calendar", {
      date: "2026-01-01",
      name: "Holiday",
    });
    expect(apiMock.put).toHaveBeenCalledWith("/leave-calendar/1", {
      date: "2026-01-02",
      name: "Holiday 2",
    });
    expect(apiMock.delete).toHaveBeenCalledWith("/leave-calendar/1");
    expect(apiMock.get).toHaveBeenCalledWith("/leaves/types");
    expect(apiMock.get).toHaveBeenCalledWith("/leaves/balance", {
      params: { year: 2026 },
    });
    expect(apiMock.get).toHaveBeenCalledWith("/leaves", {
      params: { status: "pending" },
    });
    expect(apiMock.get).toHaveBeenCalledWith("/leaves/1");
    expect(apiMock.post).toHaveBeenCalledWith("/leaves", expect.any(FormData));
    expect(apiMock.put).toHaveBeenCalledWith("/leaves/1/approve", {
      approvedBy: "hr",
    });
    expect(apiMock.put).toHaveBeenCalledWith("/leaves/1/reject", {
      rejectionReason: "x",
    });
    expect(apiMock.get).toHaveBeenCalledWith("/leave-calendar/range", {
      params: { startDate: "2026-01-01", endDate: "2026-12-31" },
    });
  });

  it("report and email services call expected endpoints", async () => {
    apiMock.get.mockResolvedValueOnce(asResponse({ totalUsers: 10 }));
    await reportsService.getDashboardSummary();

    const leavesBlob = new Blob(["leaves"]);
    apiMock.get.mockResolvedValueOnce(asResponse(leavesBlob));
    await expect(
      reportsService.downloadLeavesReport({ year: 2026 }),
    ).resolves.toBe(leavesBlob);

    const salariesBlob = new Blob(["salary"]);
    apiMock.get.mockResolvedValueOnce(asResponse(salariesBlob));
    await expect(
      reportsService.downloadSalariesReport({ year: 2026 }),
    ).resolves.toBe(salariesBlob);

    apiMock.get.mockResolvedValueOnce(asResponse({ success: true }));
    await emailService.checkConfig();

    apiMock.post.mockResolvedValueOnce(asResponse({ success: true }));
    await emailService.sendTestEmail({ email: "a@a.com" });

    expect(apiMock.get).toHaveBeenCalledWith("/reports/dashboard");
    expect(apiMock.get).toHaveBeenCalledWith("/reports/leaves", {
      params: { year: 2026 },
      responseType: "blob",
    });
    expect(apiMock.get).toHaveBeenCalledWith("/reports/salaries", {
      params: { year: 2026 },
      responseType: "blob",
    });
    expect(apiMock.get).toHaveBeenCalledWith("/email-config-check");
    expect(apiMock.post).toHaveBeenCalledWith("/test-email", {
      email: "a@a.com",
    });
  });
});
