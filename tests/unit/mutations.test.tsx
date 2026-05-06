import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useCreateLeaveMutation } from "@/hooks/mutations/use-create-leave-mutation";
import { useApproveLeaveMutation } from "@/hooks/mutations/use-approve-leave-mutation";
import { useRejectLeaveMutation } from "@/hooks/mutations/use-reject-leave-mutation";
import {
  useLoginMutation,
  useRegisterMutation,
  useVerifyEmailMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
} from "@/hooks/mutations/use-auth-mutations";
import {
  useCreateUserMutation,
  useCreateVendorMutation,
  useResetUserPasswordMutation,
  useDeleteUserMutation,
  useUpdateUserRoleMutation,
} from "@/hooks/mutations/use-user-mutations";
import {
  useCreateFacilityMutation,
  useUpdateFacilityMutation,
  useDeleteFacilityMutation,
  useCreateFacilityBookingMutation,
  useCancelFacilityBookingMutation,
} from "@/hooks/mutations/use-facility-mutations";
import {
  useCreateVoucherMutation,
  useReviewVoucherMutation,
  useResubmitVoucherMutation,
  useMarkVoucherBankUploadedMutation,
  useMarkVoucherPaidMutation,
} from "@/hooks/mutations/use-voucher-mutations";
import { useSalaryBulkUploadMutation } from "@/hooks/mutations/use-salary-mutations";
import {
  useCreateMedicalInsuranceClaimMutation,
  useResubmitMedicalInsuranceClaimMutation,
  useApproveMedicalInsuranceClaimMutation,
  useRejectMedicalInsuranceClaimMutation,
} from "@/hooks/mutations/use-medical-insurance-mutations";
import {
  useCreateConsultantSubmissionMutation,
  useResubmitConsultantSubmissionMutation,
  useApproveConsultantSubmissionMutation,
  useRejectConsultantSubmissionMutation,
} from "@/hooks/mutations/use-consultant-submission-mutations";
import {
  useCreateLeaveCalendarEntryMutation,
  useUpdateLeaveCalendarEntryMutation,
  useDeleteLeaveCalendarEntryMutation,
} from "@/hooks/mutations/use-leave-calendar-mutations";
import { useSendTestEmailMutation } from "@/hooks/mutations/use-email-mutations";

const leaveServiceMock = {
  createLeaveRequest: vi.fn(),
  approveLeaveRequest: vi.fn(),
  rejectLeaveRequest: vi.fn(),
};
const authServiceMock = {
  login: vi.fn(),
  register: vi.fn(),
  verifyEmail: vi.fn(),
  resetPassword: vi.fn(),
  changePassword: vi.fn(),
};
const userServiceMock = {
  createUser: vi.fn(),
  createVendor: vi.fn(),
  resetUserPassword: vi.fn(),
  deleteUser: vi.fn(),
  updateUserRole: vi.fn(),
};
const facilityServiceMock = {
  createFacility: vi.fn(),
  updateFacility: vi.fn(),
  deleteFacility: vi.fn(),
  createBooking: vi.fn(),
  cancelBooking: vi.fn(),
};
const voucherServiceMock = {
  createVoucher: vi.fn(),
  reviewVoucher: vi.fn(),
  resubmitVoucher: vi.fn(),
  markVoucherBankUploaded: vi.fn(),
  markVoucherPaid: vi.fn(),
};
const salaryServiceMock = {
  bulkUpload: vi.fn(),
};
const medicalInsuranceServiceMock = {
  createClaim: vi.fn(),
  resubmitClaim: vi.fn(),
  approveClaim: vi.fn(),
  rejectClaim: vi.fn(),
};
const consultantSubmissionServiceMock = {
  createSubmission: vi.fn(),
  resubmitSubmission: vi.fn(),
  approveSubmission: vi.fn(),
  rejectSubmission: vi.fn(),
};
const leaveCalendarAdminServiceMock = {
  createEntry: vi.fn(),
  updateEntry: vi.fn(),
  deleteEntry: vi.fn(),
};
const emailServiceMock = {
  sendTestEmail: vi.fn(),
};

vi.mock("@/lib/services/leave.service", () => ({
  leaveService: leaveServiceMock,
}));
vi.mock("@/lib/services/auth.service", () => ({
  authService: authServiceMock,
}));
vi.mock("@/lib/services/user.service", () => ({
  userService: userServiceMock,
}));
vi.mock("@/lib/services/facility.service", () => ({
  facilityService: facilityServiceMock,
}));
vi.mock("@/lib/services/voucher.service", () => ({
  voucherService: voucherServiceMock,
}));
vi.mock("@/lib/services/salary.service", () => ({
  salaryService: salaryServiceMock,
}));
vi.mock("@/lib/services/medical-insurance.service", () => ({
  medicalInsuranceService: medicalInsuranceServiceMock,
}));
vi.mock("@/lib/services/consultant-submission.service", () => ({
  consultantSubmissionService: consultantSubmissionServiceMock,
}));
vi.mock("@/lib/services/leave-calendar-admin.service", () => ({
  leaveCalendarAdminService: leaveCalendarAdminServiceMock,
}));
vi.mock("@/lib/services/email.service", () => ({
  emailService: emailServiceMock,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("mutation hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    leaveServiceMock.createLeaveRequest.mockResolvedValue({ id: 1 });
    leaveServiceMock.approveLeaveRequest.mockResolvedValue({ id: 1 });
    leaveServiceMock.rejectLeaveRequest.mockResolvedValue({ id: 1 });

    authServiceMock.login.mockResolvedValue({ token: "x" });
    authServiceMock.register.mockResolvedValue({ success: true });
    authServiceMock.verifyEmail.mockResolvedValue({ success: true });
    authServiceMock.resetPassword.mockResolvedValue({ success: true });
    authServiceMock.changePassword.mockResolvedValue({ success: true });

    userServiceMock.createUser.mockResolvedValue({ id: 1 });
    userServiceMock.createVendor.mockResolvedValue({ id: 1 });
    userServiceMock.resetUserPassword.mockResolvedValue({ success: true });
    userServiceMock.deleteUser.mockResolvedValue(undefined);
    userServiceMock.updateUserRole.mockResolvedValue(undefined);

    facilityServiceMock.createFacility.mockResolvedValue({ id: 1 });
    facilityServiceMock.updateFacility.mockResolvedValue({ id: 1 });
    facilityServiceMock.deleteFacility.mockResolvedValue(undefined);
    facilityServiceMock.createBooking.mockResolvedValue({ id: 1 });
    facilityServiceMock.cancelBooking.mockResolvedValue(undefined);

    voucherServiceMock.createVoucher.mockResolvedValue({ id: 1 });
    voucherServiceMock.reviewVoucher.mockResolvedValue({ id: 1 });
    voucherServiceMock.resubmitVoucher.mockResolvedValue({ id: 1 });
    voucherServiceMock.markVoucherBankUploaded.mockResolvedValue({ id: 1 });
    voucherServiceMock.markVoucherPaid.mockResolvedValue({ id: 1 });

    salaryServiceMock.bulkUpload.mockResolvedValue({ success: true });

    medicalInsuranceServiceMock.createClaim.mockResolvedValue({ id: 1 });
    medicalInsuranceServiceMock.resubmitClaim.mockResolvedValue({ id: 1 });
    medicalInsuranceServiceMock.approveClaim.mockResolvedValue({ id: 1 });
    medicalInsuranceServiceMock.rejectClaim.mockResolvedValue({ id: 1 });

    consultantSubmissionServiceMock.createSubmission.mockResolvedValue({
      id: 1,
    });
    consultantSubmissionServiceMock.resubmitSubmission.mockResolvedValue({
      id: 1,
    });
    consultantSubmissionServiceMock.approveSubmission.mockResolvedValue({
      id: 1,
    });
    consultantSubmissionServiceMock.rejectSubmission.mockResolvedValue({
      id: 1,
    });

    leaveCalendarAdminServiceMock.createEntry.mockResolvedValue({ id: 1 });
    leaveCalendarAdminServiceMock.updateEntry.mockResolvedValue({ id: 1 });
    leaveCalendarAdminServiceMock.deleteEntry.mockResolvedValue(undefined);

    emailServiceMock.sendTestEmail.mockResolvedValue({ success: true });
  });

  const runMutation = async <T,>(
    useHook: () => { mutateAsync: (payload: T) => Promise<unknown> },
    payload: T,
  ) => {
    const { result } = renderHook(() => useHook(), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync(payload);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  };

  it("leave mutations execute service methods", async () => {
    await runMutation(useCreateLeaveMutation, new FormData());
    await runMutation(useApproveLeaveMutation, {
      id: 1,
      input: { approvedBy: "hr" as const },
    });
    await runMutation(useRejectLeaveMutation, {
      id: 1,
      input: { rejectionReason: "x" },
    });

    expect(leaveServiceMock.createLeaveRequest).toHaveBeenCalledWith(
      expect.any(FormData),
    );
    expect(leaveServiceMock.approveLeaveRequest).toHaveBeenCalledWith(1, {
      approvedBy: "hr",
    });
    expect(leaveServiceMock.rejectLeaveRequest).toHaveBeenCalledWith(1, {
      rejectionReason: "x",
    });
  });

  it("auth mutations execute service methods", async () => {
    await runMutation(useLoginMutation, { email: "a@a.com", password: "p" });
    await runMutation(useRegisterMutation, {
      first_name: "A",
      last_name: "B",
      email: "a@a.com",
      employee_id: "E1",
      position: "Dev",
      department: "IT",
      hire_date: "2026-01-01",
    });
    await runMutation(useVerifyEmailMutation, "token");
    await runMutation(useResetPasswordMutation, {
      token: "t",
      password: "Password1",
    });
    await runMutation(useChangePasswordMutation, {
      currentPassword: "old",
      newPassword: "new",
    });

    expect(authServiceMock.login).toHaveBeenCalled();
    expect(authServiceMock.register).toHaveBeenCalled();
    expect(authServiceMock.verifyEmail).toHaveBeenCalledWith("token");
    expect(authServiceMock.resetPassword).toHaveBeenCalledWith(
      "t",
      "Password1",
    );
    expect(authServiceMock.changePassword).toHaveBeenCalledWith("old", "new");
  });

  it("user mutations execute service methods", async () => {
    await runMutation(useCreateUserMutation, new FormData());
    await runMutation(useCreateVendorMutation, {
      company_name: "Acme",
      email: "a@a.com",
    });
    await runMutation(useResetUserPasswordMutation, 1);
    await runMutation(useDeleteUserMutation, 1);
    await runMutation(useUpdateUserRoleMutation, {
      userId: 1,
      role: "employee",
    });

    expect(userServiceMock.createUser).toHaveBeenCalledWith(
      expect.any(FormData),
    );
    expect(userServiceMock.createVendor).toHaveBeenCalledWith({
      company_name: "Acme",
      email: "a@a.com",
    });
    expect(userServiceMock.resetUserPassword).toHaveBeenCalledWith(1);
    expect(userServiceMock.deleteUser).toHaveBeenCalledWith(1);
    expect(userServiceMock.updateUserRole).toHaveBeenCalledWith(1, "employee");
  });

  it("facility mutations execute service methods", async () => {
    await runMutation(useCreateFacilityMutation, {
      name: "Room",
      type: "meeting_room",
    });
    await runMutation(useUpdateFacilityMutation, {
      id: 1,
      payload: { name: "Room", type: "meeting_room" },
    });
    await runMutation(useDeleteFacilityMutation, 1);
    await runMutation(useCreateFacilityBookingMutation, {
      facility_id: 1,
      start_time: "s",
      end_time: "e",
    });
    await runMutation(useCancelFacilityBookingMutation, 1);

    expect(facilityServiceMock.createFacility).toHaveBeenCalled();
    expect(facilityServiceMock.updateFacility).toHaveBeenCalledWith(1, {
      name: "Room",
      type: "meeting_room",
    });
    expect(facilityServiceMock.deleteFacility).toHaveBeenCalledWith(1);
    expect(facilityServiceMock.createBooking).toHaveBeenCalledWith({
      facility_id: 1,
      start_time: "s",
      end_time: "e",
    });
    expect(facilityServiceMock.cancelBooking).toHaveBeenCalledWith(1);
  });

  it("voucher mutations execute service methods", async () => {
    await runMutation(useCreateVoucherMutation, { vendor_id: 1, amount: 100 });
    await runMutation(useReviewVoucherMutation, {
      id: 1,
      payload: { action: "approve" as const },
    });
    await runMutation(useResubmitVoucherMutation, 1);
    await runMutation(useMarkVoucherBankUploadedMutation, 1);
    await runMutation(useMarkVoucherPaidMutation, 1);

    expect(voucherServiceMock.createVoucher).toHaveBeenCalledWith({
      vendor_id: 1,
      amount: 100,
    });
    expect(voucherServiceMock.reviewVoucher).toHaveBeenCalledWith(1, {
      action: "approve",
    });
    expect(voucherServiceMock.resubmitVoucher).toHaveBeenCalledWith(1);
    expect(voucherServiceMock.markVoucherBankUploaded).toHaveBeenCalledWith(1);
    expect(voucherServiceMock.markVoucherPaid).toHaveBeenCalledWith(1);
  });

  it("remaining mutations execute service methods", async () => {
    await runMutation(useSalaryBulkUploadMutation, new FormData());

    await runMutation(useCreateMedicalInsuranceClaimMutation, new FormData());
    await runMutation(useResubmitMedicalInsuranceClaimMutation, {
      id: 1,
      formData: new FormData(),
    });
    await runMutation(useApproveMedicalInsuranceClaimMutation, 1);
    await runMutation(useRejectMedicalInsuranceClaimMutation, {
      id: 1,
      admin_comment: "x",
    });

    await runMutation(useCreateConsultantSubmissionMutation, new FormData());
    await runMutation(useResubmitConsultantSubmissionMutation, {
      id: 1,
      formData: new FormData(),
    });
    await runMutation(useApproveConsultantSubmissionMutation, 1);
    await runMutation(useRejectConsultantSubmissionMutation, {
      id: 1,
      admin_comment: "x",
    });

    await runMutation(useCreateLeaveCalendarEntryMutation, {
      date: "2026-01-01",
      name: "Holiday",
    });
    await runMutation(useUpdateLeaveCalendarEntryMutation, {
      id: 1,
      payload: { date: "2026-01-01", name: "Holiday" },
    });
    await runMutation(useDeleteLeaveCalendarEntryMutation, 1);

    await runMutation(useSendTestEmailMutation, { email: "a@a.com" });

    expect(salaryServiceMock.bulkUpload).toHaveBeenCalledWith(
      expect.any(FormData),
    );
    expect(medicalInsuranceServiceMock.createClaim).toHaveBeenCalled();
    expect(medicalInsuranceServiceMock.resubmitClaim).toHaveBeenCalledWith(
      1,
      expect.any(FormData),
    );
    expect(medicalInsuranceServiceMock.approveClaim).toHaveBeenCalledWith(1);
    expect(medicalInsuranceServiceMock.rejectClaim).toHaveBeenCalledWith(
      1,
      "x",
    );

    expect(consultantSubmissionServiceMock.createSubmission).toHaveBeenCalled();
    expect(
      consultantSubmissionServiceMock.resubmitSubmission,
    ).toHaveBeenCalledWith(1, expect.any(FormData));
    expect(
      consultantSubmissionServiceMock.approveSubmission,
    ).toHaveBeenCalledWith(1);
    expect(
      consultantSubmissionServiceMock.rejectSubmission,
    ).toHaveBeenCalledWith(1, "x");

    expect(leaveCalendarAdminServiceMock.createEntry).toHaveBeenCalledWith({
      date: "2026-01-01",
      name: "Holiday",
    });
    expect(leaveCalendarAdminServiceMock.updateEntry).toHaveBeenCalledWith(1, {
      date: "2026-01-01",
      name: "Holiday",
    });
    expect(leaveCalendarAdminServiceMock.deleteEntry).toHaveBeenCalledWith(1);

    expect(emailServiceMock.sendTestEmail).toHaveBeenCalledWith({
      email: "a@a.com",
    });
  });
});
