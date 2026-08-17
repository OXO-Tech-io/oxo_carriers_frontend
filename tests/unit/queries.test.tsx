import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useAllChangeRequestsQuery } from "@/hooks/queries/use-all-change-requests-query";
import { useChangeRequestDetailQuery } from "@/hooks/queries/use-change-request-detail-query";
import { useCommunicationsQuery, useMyCommunicationsQuery } from "@/hooks/queries/use-communications-query";
import {
  useManageDocumentsQuery,
  useMyDocumentsQuery,
  useEmployeeDocumentsQuery,
} from "@/hooks/queries/use-documents-query";
import { useEmployeeDependentsQuery } from "@/hooks/queries/use-employee-dependents-query";
import { useEmployeeEducationQuery } from "@/hooks/queries/use-employee-education-query";
import { useEmployeeEmergencyContactsQuery } from "@/hooks/queries/use-employee-emergency-contacts-query";
import { useEmployeeNomineesQuery } from "@/hooks/queries/use-employee-nominees-query";
import { useEmployeeNotesQuery } from "@/hooks/queries/use-employee-notes-query";
import { useEmployeePersonalDetailsQuery } from "@/hooks/queries/use-employee-personal-details-query";
import { useEmployeeWelfareInfoQuery } from "@/hooks/queries/use-employee-welfare-info-query";
import { useEmployeeWorkHistoryQuery } from "@/hooks/queries/use-employee-work-history-query";
import { useEventsQuery, useEventQuery } from "@/hooks/queries/use-events-query";
import { useExperienceSummaryQuery } from "@/hooks/queries/use-experience-summary-query";
import {
  useFormsQuery,
  useFormQuery,
  useAssignedFormsQuery,
  useMyFormResponseQuery,
  useFormResponsesQuery,
  useFormSettingsQuery,
  useFormThemeQuery,
  useFormAnalyticsQuery,
} from "@/hooks/queries/use-forms-query";
import { useGroupsQuery, useGroupQuery } from "@/hooks/queries/use-groups-query";
import { useHolidaysQuery } from "@/hooks/queries/use-holidays-query";
import { useLeaveBalanceQuery } from "@/hooks/queries/use-leave-balance-query";
import { useLeaveRequestsQuery } from "@/hooks/queries/use-leave-requests-query";
import { useLeaveTypesQuery } from "@/hooks/queries/use-leave-types-query";
import { useMyChangeRequestsQuery } from "@/hooks/queries/use-my-change-requests-query";
import { useNotificationsQuery } from "@/hooks/queries/use-notifications-query";
import { useProfileQuery } from "@/hooks/queries/use-profile-query";
import { useUnreadNotificationsCountQuery } from "@/hooks/queries/use-unread-notifications-count-query";
import {
  useMyWorkLogsQuery,
  useAllWorkLogsQuery,
  useWorkLogSummaryQuery,
} from "@/hooks/queries/use-work-logs-query";

const {
  profileServiceMock,
  communicationServiceMock,
  documentServiceMock,
  employeeNoteServiceMock,
  eventServiceMock,
  formServiceMock,
  groupServiceMock,
  leaveCalendarServiceMock,
  leaveServiceMock,
  notificationServiceMock,
  workLogServiceMock,
  useAuthMock,
} = vi.hoisted(() => ({
  profileServiceMock: {
    listChangeRequests: vi.fn(),
    getChangeRequestById: vi.fn(),
    getDependents: vi.fn(),
    getEducationForUser: vi.fn(),
    getMyEducation: vi.fn(),
    getEmergencyContacts: vi.fn(),
    getNominees: vi.fn(),
    getEmployeePersonalDetails: vi.fn(),
    getWelfareInfo: vi.fn(),
    getWorkHistoryForUser: vi.fn(),
    getMyWorkHistory: vi.fn(),
    getExperienceSummaryForUser: vi.fn(),
    getMyExperienceSummary: vi.fn(),
    getMyProfile: vi.fn(),
  },
  communicationServiceMock: { listAll: vi.fn(), listMine: vi.fn() },
  documentServiceMock: { listAll: vi.fn(), listForEmployee: vi.fn() },
  employeeNoteServiceMock: { listForEmployee: vi.fn() },
  eventServiceMock: { list: vi.fn(), getWithParticipants: vi.fn() },
  formServiceMock: {
    list: vi.fn(),
    getById: vi.fn(),
    listAssignedToMe: vi.fn(),
    getMyResponse: vi.fn(),
    listResponses: vi.fn(),
    getSettings: vi.fn(),
    getTheme: vi.fn(),
    getAnalytics: vi.fn(),
  },
  groupServiceMock: { list: vi.fn(), getById: vi.fn() },
  leaveCalendarServiceMock: { getHolidaysInRange: vi.fn() },
  leaveServiceMock: { getLeaveBalance: vi.fn(), listLeaveRequests: vi.fn(), getLeaveTypes: vi.fn() },
  notificationServiceMock: { listMine: vi.fn(), unreadCount: vi.fn() },
  workLogServiceMock: { listMine: vi.fn(), listAll: vi.fn(), getSummary: vi.fn() },
  useAuthMock: vi.fn(),
}));

vi.mock("@/lib/services/profile.service", () => ({ profileService: profileServiceMock }));
vi.mock("@/lib/services/communication.service", () => ({ communicationService: communicationServiceMock }));
vi.mock("@/lib/services/document.service", () => ({ documentService: documentServiceMock }));
vi.mock("@/lib/services/employee-note.service", () => ({ employeeNoteService: employeeNoteServiceMock }));
vi.mock("@/lib/services/event.service", () => ({ eventService: eventServiceMock }));
vi.mock("@/lib/services/form.service", () => ({ formService: formServiceMock }));
vi.mock("@/lib/services/group.service", () => ({ groupService: groupServiceMock }));
vi.mock("@/lib/services/leave-calendar.service", () => ({ leaveCalendarService: leaveCalendarServiceMock }));
vi.mock("@/lib/services/leave.service", () => ({ leaveService: leaveServiceMock }));
vi.mock("@/lib/services/notification.service", () => ({ notificationService: notificationServiceMock }));
vi.mock("@/lib/services/work-log.service", () => ({ workLogService: workLogServiceMock }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: useAuthMock }));

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const runQuery = async <T,>(useHook: () => { data: T | undefined; isSuccess: boolean; isFetched: boolean }) => {
  const { result } = renderHook(() => useHook(), { wrapper: createWrapper() });
  await waitFor(() => expect(result.current.isFetched).toBe(true));
  return result.current;
};

describe("query hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(profileServiceMock).forEach((fn) => fn.mockResolvedValue([]));
    Object.values(communicationServiceMock).forEach((fn) => fn.mockResolvedValue([]));
    Object.values(documentServiceMock).forEach((fn) => fn.mockResolvedValue([]));
    Object.values(employeeNoteServiceMock).forEach((fn) => fn.mockResolvedValue([]));
    Object.values(eventServiceMock).forEach((fn) => fn.mockResolvedValue([]));
    Object.values(formServiceMock).forEach((fn) => fn.mockResolvedValue([]));
    Object.values(groupServiceMock).forEach((fn) => fn.mockResolvedValue([]));
    Object.values(leaveCalendarServiceMock).forEach((fn) => fn.mockResolvedValue([]));
    Object.values(leaveServiceMock).forEach((fn) => fn.mockResolvedValue([]));
    Object.values(notificationServiceMock).forEach((fn) => fn.mockResolvedValue([]));
    Object.values(workLogServiceMock).forEach((fn) => fn.mockResolvedValue([]));
    useAuthMock.mockReturnValue({ user: { id: 7, employee_id: "E1" } });
  });

  it("useAllChangeRequestsQuery and useMyChangeRequestsQuery call listChangeRequests", async () => {
    profileServiceMock.listChangeRequests.mockResolvedValue([{ id: 1 }]);
    const a = await runQuery(() => useAllChangeRequestsQuery({ status: "pending" }));
    expect(a.data).toEqual([{ id: 1 }]);
    const b = await runQuery(() => useMyChangeRequestsQuery());
    expect(b.data).toEqual([{ id: 1 }]);
    expect(profileServiceMock.listChangeRequests).toHaveBeenCalledWith({ status: "pending" });
  });

  it("useChangeRequestDetailQuery only runs when an id is given", async () => {
    profileServiceMock.getChangeRequestById.mockResolvedValue({ id: 5 });
    const withId = await runQuery(() => useChangeRequestDetailQuery(5));
    expect(withId.data).toEqual({ id: 5 });

    const { result } = renderHook(() => useChangeRequestDetailQuery(undefined), {
      wrapper: createWrapper(),
    });
    expect(result.current.isFetched).toBe(false);
    expect(profileServiceMock.getChangeRequestById).toHaveBeenCalledTimes(1);
  });

  it("useCommunicationsQuery and useMyCommunicationsQuery", async () => {
    communicationServiceMock.listAll.mockResolvedValue([{ id: 1 }]);
    communicationServiceMock.listMine.mockResolvedValue([{ id: 2 }]);
    const all = await runQuery(() => useCommunicationsQuery());
    expect(all.data).toEqual([{ id: 1 }]);
    const mine = await runQuery(() => useMyCommunicationsQuery());
    expect(mine.data).toEqual([{ id: 2 }]);
    expect(communicationServiceMock.listMine).toHaveBeenCalledWith("E1");
  });

  it("useMyCommunicationsQuery is disabled without an employee id", () => {
    useAuthMock.mockReturnValue({ user: null });
    const { result } = renderHook(() => useMyCommunicationsQuery(), { wrapper: createWrapper() });
    expect(result.current.isFetched).toBe(false);
    expect(communicationServiceMock.listMine).not.toHaveBeenCalled();
  });

  it("useManageDocumentsQuery, useMyDocumentsQuery and useEmployeeDocumentsQuery call the right service methods", async () => {
    documentServiceMock.listAll.mockResolvedValue({ items: [{ id: 1 }], total: 1, page: 1, pageSize: 10 });
    documentServiceMock.listForEmployee.mockResolvedValueOnce([{ id: 2 }]).mockResolvedValueOnce([{ id: 3 }]);

    const manage = await runQuery(() => useManageDocumentsQuery());
    expect(manage.data).toEqual({ items: [{ id: 1 }], total: 1, page: 1, pageSize: 10 });

    const mine = await runQuery(() => useMyDocumentsQuery());
    expect(mine.data).toEqual([{ id: 2 }]);
    expect(documentServiceMock.listForEmployee).toHaveBeenCalledWith(7);

    const forEmployee = await runQuery(() => useEmployeeDocumentsQuery(5));
    expect(forEmployee.data).toEqual([{ id: 3 }]);
    expect(documentServiceMock.listForEmployee).toHaveBeenCalledWith(5);
  });

  it("useMyDocumentsQuery is disabled without a user id", () => {
    useAuthMock.mockReturnValue({ user: null });
    const { result } = renderHook(() => useMyDocumentsQuery(), { wrapper: createWrapper() });
    expect(result.current.isFetched).toBe(false);
    expect(documentServiceMock.listForEmployee).not.toHaveBeenCalled();
  });

  it("useManageDocumentsQuery is disabled when enabled=false", () => {
    const { result } = renderHook(() => useManageDocumentsQuery({}, false), { wrapper: createWrapper() });
    expect(result.current.isFetched).toBe(false);
    expect(documentServiceMock.listAll).not.toHaveBeenCalled();
  });

  it("profile sub-resource queries dispatch to the right profileService method", async () => {
    await runQuery(() => useEmployeeDependentsQuery(1));
    expect(profileServiceMock.getDependents).toHaveBeenCalledWith(1);

    await runQuery(() => useEmployeeEducationQuery());
    expect(profileServiceMock.getMyEducation).toHaveBeenCalled();
    await runQuery(() => useEmployeeEducationQuery(2));
    expect(profileServiceMock.getEducationForUser).toHaveBeenCalledWith(2);

    await runQuery(() => useEmployeeEmergencyContactsQuery(1));
    expect(profileServiceMock.getEmergencyContacts).toHaveBeenCalledWith(1);

    await runQuery(() => useEmployeeNomineesQuery(1));
    expect(profileServiceMock.getNominees).toHaveBeenCalledWith(1);

    await runQuery(() => useEmployeePersonalDetailsQuery(1));
    expect(profileServiceMock.getEmployeePersonalDetails).toHaveBeenCalledWith(1);

    await runQuery(() => useEmployeeWelfareInfoQuery(1));
    expect(profileServiceMock.getWelfareInfo).toHaveBeenCalledWith(1);

    await runQuery(() => useEmployeeWorkHistoryQuery());
    expect(profileServiceMock.getMyWorkHistory).toHaveBeenCalled();
    await runQuery(() => useEmployeeWorkHistoryQuery(2));
    expect(profileServiceMock.getWorkHistoryForUser).toHaveBeenCalledWith(2);

    await runQuery(() => useExperienceSummaryQuery());
    expect(profileServiceMock.getMyExperienceSummary).toHaveBeenCalled();
    await runQuery(() => useExperienceSummaryQuery(2));
    expect(profileServiceMock.getExperienceSummaryForUser).toHaveBeenCalledWith(2);

    await runQuery(() => useProfileQuery());
    expect(profileServiceMock.getMyProfile).toHaveBeenCalled();
  });

  it("dependent-id queries stay disabled when the id is undefined", () => {
    const cases = [
      useEmployeeDependentsQuery,
      useEmployeeEmergencyContactsQuery,
      useEmployeeNomineesQuery,
      useEmployeePersonalDetailsQuery,
      useEmployeeWelfareInfoQuery,
    ];
    for (const useHook of cases) {
      const { result } = renderHook(() => useHook(undefined), { wrapper: createWrapper() });
      expect(result.current.isFetched).toBe(false);
    }
  });

  it("useEmployeeNotesQuery lists notes for an employee", async () => {
    employeeNoteServiceMock.listForEmployee.mockResolvedValue([{ id: 1 }]);
    const result = await runQuery(() => useEmployeeNotesQuery(5));
    expect(result.data).toEqual([{ id: 1 }]);
    expect(employeeNoteServiceMock.listForEmployee).toHaveBeenCalledWith(5);
  });

  it("event queries list and fetch a single event by id, gated on id", async () => {
    eventServiceMock.list.mockResolvedValue([{ id: 1 }]);
    eventServiceMock.getWithParticipants.mockResolvedValue({ event: { id: 1 }, participants: [] });
    await runQuery(() => useEventsQuery());
    expect(eventServiceMock.list).toHaveBeenCalled();
    await runQuery(() => useEventQuery(1));
    expect(eventServiceMock.getWithParticipants).toHaveBeenCalledWith(1);

    const { result } = renderHook(() => useEventQuery(0), { wrapper: createWrapper() });
    expect(result.current.isFetched).toBe(false);
  });

  it("form queries dispatch to the right formService method, gated on id where relevant", async () => {
    await runQuery(() => useFormsQuery());
    expect(formServiceMock.list).toHaveBeenCalled();
    await runQuery(() => useFormQuery(1));
    expect(formServiceMock.getById).toHaveBeenCalledWith(1);
    await runQuery(() => useAssignedFormsQuery());
    expect(formServiceMock.listAssignedToMe).toHaveBeenCalled();
    await runQuery(() => useMyFormResponseQuery(1));
    expect(formServiceMock.getMyResponse).toHaveBeenCalledWith(1);
    await runQuery(() => useFormResponsesQuery(1));
    expect(formServiceMock.listResponses).toHaveBeenCalledWith(1);
    await runQuery(() => useFormSettingsQuery(1));
    expect(formServiceMock.getSettings).toHaveBeenCalledWith(1);
    await runQuery(() => useFormThemeQuery(1));
    expect(formServiceMock.getTheme).toHaveBeenCalledWith(1);
    await runQuery(() => useFormAnalyticsQuery(1));
    expect(formServiceMock.getAnalytics).toHaveBeenCalledWith(1);

    const { result } = renderHook(() => useFormQuery(0), { wrapper: createWrapper() });
    expect(result.current.isFetched).toBe(false);
  });

  it("group queries list and fetch detail, gated on a non-null id", async () => {
    groupServiceMock.list.mockResolvedValue([{ id: 1 }]);
    groupServiceMock.getById.mockResolvedValue({ id: 1, members: [] });
    await runQuery(() => useGroupsQuery());
    expect(groupServiceMock.list).toHaveBeenCalled();
    await runQuery(() => useGroupQuery(1));
    expect(groupServiceMock.getById).toHaveBeenCalledWith(1);

    const { result } = renderHook(() => useGroupQuery(null), { wrapper: createWrapper() });
    expect(result.current.isFetched).toBe(false);
  });

  it("useHolidaysQuery requires both start and end dates", async () => {
    leaveCalendarServiceMock.getHolidaysInRange.mockResolvedValue([{ id: 1 }]);
    await runQuery(() => useHolidaysQuery("2026-01-01", "2026-01-31"));
    expect(leaveCalendarServiceMock.getHolidaysInRange).toHaveBeenCalledWith(
      "2026-01-01",
      "2026-01-31",
    );

    const { result } = renderHook(() => useHolidaysQuery("", ""), { wrapper: createWrapper() });
    expect(result.current.isFetched).toBe(false);
  });

  it("leave queries dispatch to leaveService", async () => {
    leaveServiceMock.getLeaveBalance.mockResolvedValue({ balance: 5 });
    await runQuery(() => useLeaveBalanceQuery("E1", 2026));
    expect(leaveServiceMock.getLeaveBalance).toHaveBeenCalledWith("E1", 2026);

    const { result } = renderHook(() => useLeaveBalanceQuery(undefined), { wrapper: createWrapper() });
    expect(result.current.isFetched).toBe(false);

    leaveServiceMock.listLeaveRequests.mockResolvedValue([{ id: 1 }]);
    await runQuery(() => useLeaveRequestsQuery({ status: "pending" }));
    expect(leaveServiceMock.listLeaveRequests).toHaveBeenCalledWith({ status: "pending" });

    leaveServiceMock.getLeaveTypes.mockResolvedValue([{ id: 1 }]);
    await runQuery(() => useLeaveTypesQuery());
    expect(leaveServiceMock.getLeaveTypes).toHaveBeenCalled();
  });

  it("notification queries dispatch to notificationService", async () => {
    notificationServiceMock.listMine.mockResolvedValue([{ id: 1 }]);
    notificationServiceMock.unreadCount.mockResolvedValue(4);
    await runQuery(() => useNotificationsQuery({ isRead: false }));
    expect(notificationServiceMock.listMine).toHaveBeenCalledWith({ isRead: false });
    const unread = await runQuery(() => useUnreadNotificationsCountQuery());
    expect(unread.data).toBe(4);
  });

  it("work log queries dispatch to workLogService", async () => {
    workLogServiceMock.listMine.mockResolvedValue([{ id: 1 }]);
    workLogServiceMock.listAll.mockResolvedValue([{ id: 2 }]);
    workLogServiceMock.getSummary.mockResolvedValue([{ userId: 1 }]);

    await runQuery(() => useMyWorkLogsQuery({ userId: 1 }));
    expect(workLogServiceMock.listMine).toHaveBeenCalledWith({ userId: 1 });
    await runQuery(() => useAllWorkLogsQuery({ userId: 1 }));
    expect(workLogServiceMock.listAll).toHaveBeenCalledWith({ userId: 1 });
    await runQuery(() => useWorkLogSummaryQuery({ userId: 1 }));
    expect(workLogServiceMock.getSummary).toHaveBeenCalledWith({ userId: 1 });
  });
});
