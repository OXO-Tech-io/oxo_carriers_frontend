import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useApproveProfileChangeMutation } from "@/hooks/mutations/use-approve-profile-change-mutation";
import { useRejectProfileChangeMutation } from "@/hooks/mutations/use-reject-profile-change-mutation";
import { useReturnProfileChangeMutation } from "@/hooks/mutations/use-return-profile-change-mutation";
import { useSubmitProfileChangeMutation } from "@/hooks/mutations/use-submit-profile-change-mutation";
import {
  useCreateCommunicationMutation,
  useRespondCommunicationMutation,
  useDeleteCommunicationMutation,
} from "@/hooks/mutations/use-communication-mutations";
import {
  useCreateDocumentMutation,
  useDeleteDocumentMutation,
} from "@/hooks/mutations/use-document-mutations";
import {
  useCreateEmployeeNoteMutation,
  useUpdateEmployeeNoteMutation,
} from "@/hooks/mutations/use-employee-note-mutations";
import {
  useCreateEventMutation,
  useRecordParticipationMutation,
} from "@/hooks/mutations/use-event-mutations";
import {
  useCreateGroupMutation,
  useRenameGroupMutation,
  useDeleteGroupMutation,
  useAddGroupMembersMutation,
  useRemoveGroupMemberMutation,
} from "@/hooks/mutations/use-group-mutations";
import { useMarkNotificationReadMutation } from "@/hooks/mutations/use-mark-notification-read-mutation";
import { useMarkAllNotificationsReadMutation } from "@/hooks/mutations/use-mark-all-notifications-read-mutation";
import {
  useSubmitWorkLogMutation,
  useBulkUploadWorkLogMutation,
} from "@/hooks/mutations/use-work-log-mutations";
import {
  useCreateFormMutation,
  useUpdateFormMutation,
  useDeleteFormMutation,
  useDuplicateFormMutation,
  usePublishFormMutation,
  useUnpublishFormMutation,
  useArchiveFormMutation,
  useDistributeFormMutation,
  useSubmitFormResponseMutation,
  useCreateSectionMutation,
  useUpdateSectionMutation,
  useDeleteSectionMutation,
  useReorderSectionsMutation,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useReorderQuestionsMutation,
  useCreateLogicRuleMutation,
  useUpdateLogicRuleMutation,
  useDeleteLogicRuleMutation,
  useUpdateFormSettingsMutation,
  useUpdateFormThemeMutation,
} from "@/hooks/mutations/use-form-mutations";

const {
  profileServiceMock,
  communicationServiceMock,
  documentServiceMock,
  employeeNoteServiceMock,
  eventServiceMock,
  groupServiceMock,
  notificationServiceMock,
  workLogServiceMock,
  formServiceMock,
} = vi.hoisted(() => ({
  profileServiceMock: {
    approveChangeRequest: vi.fn(),
    rejectChangeRequest: vi.fn(),
    returnChangeRequest: vi.fn(),
    submitChangeRequest: vi.fn(),
  },
  communicationServiceMock: {
    create: vi.fn(),
    respond: vi.fn(),
    delete: vi.fn(),
  },
  documentServiceMock: {
    create: vi.fn(),
    remove: vi.fn(),
  },
  employeeNoteServiceMock: {
    create: vi.fn(),
    update: vi.fn(),
  },
  eventServiceMock: {
    create: vi.fn(),
    recordParticipation: vi.fn(),
  },
  groupServiceMock: {
    create: vi.fn(),
    rename: vi.fn(),
    remove: vi.fn(),
    addMembers: vi.fn(),
    removeMember: vi.fn(),
  },
  notificationServiceMock: {
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
  workLogServiceMock: {
    submit: vi.fn(),
    bulkUpload: vi.fn(),
  },
  formServiceMock: {
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    duplicate: vi.fn(),
    publish: vi.fn(),
    unpublish: vi.fn(),
    archive: vi.fn(),
    distribute: vi.fn(),
    submitResponse: vi.fn(),
    createSection: vi.fn(),
    updateSection: vi.fn(),
    deleteSection: vi.fn(),
    reorderSections: vi.fn(),
    createQuestion: vi.fn(),
    updateQuestion: vi.fn(),
    deleteQuestion: vi.fn(),
    reorderQuestions: vi.fn(),
    createLogicRule: vi.fn(),
    updateLogicRule: vi.fn(),
    deleteLogicRule: vi.fn(),
    updateSettings: vi.fn(),
    updateTheme: vi.fn(),
  },
}));

vi.mock("@/lib/services/profile.service", () => ({ profileService: profileServiceMock }));
vi.mock("@/lib/services/communication.service", () => ({ communicationService: communicationServiceMock }));
vi.mock("@/lib/services/document.service", () => ({ documentService: documentServiceMock }));
vi.mock("@/lib/services/employee-note.service", () => ({ employeeNoteService: employeeNoteServiceMock }));
vi.mock("@/lib/services/event.service", () => ({ eventService: eventServiceMock }));
vi.mock("@/lib/services/group.service", () => ({ groupService: groupServiceMock }));
vi.mock("@/lib/services/notification.service", () => ({ notificationService: notificationServiceMock }));
vi.mock("@/lib/services/work-log.service", () => ({ workLogService: workLogServiceMock }));
vi.mock("@/lib/services/form.service", () => ({ formService: formServiceMock }));
vi.mock("@/hooks/queries/use-employee-notes-query", () => ({
  employeeNotesQueryKey: (employeeId: number) => ["employee-notes", employeeId],
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const runMutation = async <T,>(
  useHook: () => { mutateAsync: (payload: T) => Promise<unknown>; isSuccess: boolean },
  payload: T,
) => {
  const { result } = renderHook(() => useHook(), { wrapper: createWrapper() });
  await act(async () => {
    await result.current.mutateAsync(payload);
  });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
};

describe("remaining mutation hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(profileServiceMock).forEach((fn) => fn.mockResolvedValue({ id: 1 }));
    Object.values(communicationServiceMock).forEach((fn) => fn.mockResolvedValue({ id: 1 }));
    Object.values(documentServiceMock).forEach((fn) => fn.mockResolvedValue({ id: 1 }));
    Object.values(employeeNoteServiceMock).forEach((fn) => fn.mockResolvedValue({ id: 1 }));
    Object.values(eventServiceMock).forEach((fn) => fn.mockResolvedValue({ id: 1 }));
    Object.values(groupServiceMock).forEach((fn) => fn.mockResolvedValue({ id: 1 }));
    Object.values(notificationServiceMock).forEach((fn) => fn.mockResolvedValue(undefined));
    Object.values(workLogServiceMock).forEach((fn) => fn.mockResolvedValue({ id: 1 }));
    Object.values(formServiceMock).forEach((fn) => fn.mockResolvedValue({ id: 1 }));
  });

  it("profile change mutations execute service methods", async () => {
    await runMutation(useApproveProfileChangeMutation, { id: 1, reviewerComments: "ok" });
    await runMutation(useRejectProfileChangeMutation, { id: 1, reviewerComments: "no" });
    await runMutation(useReturnProfileChangeMutation, { id: 1, reviewerComments: "fix" });
    await runMutation(useSubmitProfileChangeMutation, { field: "email" } as any);

    expect(profileServiceMock.approveChangeRequest).toHaveBeenCalledWith(1, "ok");
    expect(profileServiceMock.rejectChangeRequest).toHaveBeenCalledWith(1, "no");
    expect(profileServiceMock.returnChangeRequest).toHaveBeenCalledWith(1, "fix");
    expect(profileServiceMock.submitChangeRequest).toHaveBeenCalledWith({ field: "email" });
  });

  it("communication mutations execute service methods", async () => {
    await runMutation(useCreateCommunicationMutation, {
      title: "T",
      body: "B",
      recipientUserIds: [1],
      recipientGroupIds: [2],
      files: [],
    });
    await runMutation(useRespondCommunicationMutation, { id: 1, responseText: "ack" });
    await runMutation(useDeleteCommunicationMutation, 1);

    expect(communicationServiceMock.create).toHaveBeenCalledWith("T", "B", [1], [2], [], undefined, undefined);
    expect(communicationServiceMock.respond).toHaveBeenCalledWith(1, "ack");
    expect(communicationServiceMock.delete).toHaveBeenCalledWith(1);
  });

  it("document mutations execute service methods", async () => {
    await runMutation(useCreateDocumentMutation, {
      title: "Contract",
      targetType: "individual",
      individualEmployeeIds: [1],
      files: [],
    });
    await runMutation(useDeleteDocumentMutation, 1);

    expect(documentServiceMock.create).toHaveBeenCalledWith({
      title: "Contract",
      targetType: "individual",
      individualEmployeeIds: [1],
      files: [],
    });
    expect(documentServiceMock.remove).toHaveBeenCalledWith(1);
  });

  it("employee note mutations execute service methods scoped to an employee", async () => {
    await runMutation(() => useCreateEmployeeNoteMutation(5), { content: "hi", files: [] });
    await runMutation(() => useUpdateEmployeeNoteMutation(5), { id: 1, content: "updated" });

    expect(employeeNoteServiceMock.create).toHaveBeenCalledWith(5, "hi", []);
    expect(employeeNoteServiceMock.update).toHaveBeenCalledWith(1, "updated");
  });

  it("event mutations execute service methods", async () => {
    await runMutation(useCreateEventMutation, { name: "Party", eventDate: "2026-01-01" });
    await runMutation(() => useRecordParticipationMutation(1), [{ userId: 2, participated: true }]);

    expect(eventServiceMock.create).toHaveBeenCalledWith({ name: "Party", eventDate: "2026-01-01" });
    expect(eventServiceMock.recordParticipation).toHaveBeenCalledWith(1, [{ userId: 2, participated: true }]);
  });

  it("group mutations execute service methods", async () => {
    await runMutation(useCreateGroupMutation, "Engineering");
    await runMutation(useRenameGroupMutation, { id: 1, name: "Eng" });
    await runMutation(useDeleteGroupMutation, 1);
    await runMutation(useAddGroupMembersMutation, { id: 1, userIds: [2] });
    await runMutation(useRemoveGroupMemberMutation, { id: 1, userId: 2 });

    expect(groupServiceMock.create).toHaveBeenCalledWith("Engineering");
    expect(groupServiceMock.rename).toHaveBeenCalledWith(1, "Eng");
    expect(groupServiceMock.remove).toHaveBeenCalledWith(1);
    expect(groupServiceMock.addMembers).toHaveBeenCalledWith(1, [2]);
    expect(groupServiceMock.removeMember).toHaveBeenCalledWith(1, 2);
  });

  it("notification mutations execute service methods", async () => {
    await runMutation(useMarkNotificationReadMutation, 1);
    await runMutation(useMarkAllNotificationsReadMutation, undefined);

    expect(notificationServiceMock.markRead).toHaveBeenCalledWith(1);
    expect(notificationServiceMock.markAllRead).toHaveBeenCalled();
  });

  it("work log mutations execute service methods", async () => {
    await runMutation(useSubmitWorkLogMutation, [{ date: "2026-01-01", hours: 8 } as any]);
    await runMutation(useBulkUploadWorkLogMutation, new File(["x"], "logs.xlsx"));

    expect(workLogServiceMock.submit).toHaveBeenCalledWith([{ date: "2026-01-01", hours: 8 }]);
    expect(workLogServiceMock.bulkUpload).toHaveBeenCalledWith(expect.any(File));
  });

  it("form top-level mutations execute service methods", async () => {
    await runMutation(useCreateFormMutation, { title: "Survey" });
    await runMutation(useUpdateFormMutation, { id: 1, input: { title: "Updated" } });
    await runMutation(useDeleteFormMutation, 1);
    await runMutation(useDuplicateFormMutation, 1);
    await runMutation(usePublishFormMutation, 1);
    await runMutation(useUnpublishFormMutation, 1);
    await runMutation(useArchiveFormMutation, 1);
    await runMutation(useDistributeFormMutation, { id: 1, userIds: [1], groupIds: [2], closeAt: null });
    await runMutation(() => useSubmitFormResponseMutation(1), { answers: [], files: {} });

    expect(formServiceMock.create).toHaveBeenCalledWith({ title: "Survey" });
    expect(formServiceMock.update).toHaveBeenCalledWith(1, { title: "Updated" });
    expect(formServiceMock.remove).toHaveBeenCalledWith(1);
    expect(formServiceMock.duplicate).toHaveBeenCalledWith(1);
    expect(formServiceMock.publish).toHaveBeenCalledWith(1);
    expect(formServiceMock.unpublish).toHaveBeenCalledWith(1);
    expect(formServiceMock.archive).toHaveBeenCalledWith(1);
    expect(formServiceMock.distribute).toHaveBeenCalledWith(1, [1], [2], null);
    expect(formServiceMock.submitResponse).toHaveBeenCalledWith(1, [], {}, true);
  });

  it("form section/question/logic-rule/settings mutations execute service methods", async () => {
    await runMutation(() => useCreateSectionMutation(1), { title: "S1" });
    await runMutation(() => useUpdateSectionMutation(1), { id: 2, input: { title: "S1b" } });
    await runMutation(() => useDeleteSectionMutation(1), 2);
    await runMutation(() => useReorderSectionsMutation(1), [2, 3]);

    await runMutation(() => useCreateQuestionMutation(1), { type: "text" } as any);
    await runMutation(() => useUpdateQuestionMutation(1), { id: 4, input: { title: "Q" } });
    await runMutation(() => useDeleteQuestionMutation(1), 4);
    await runMutation(() => useReorderQuestionsMutation(1), { questionIds: [4, 5], sectionId: 2 });

    await runMutation(() => useCreateLogicRuleMutation(1), {
      targetQuestionId: 4,
      sourceQuestionId: 5,
      comparator: "equals",
    });
    await runMutation(() => useUpdateLogicRuleMutation(1), { id: 9, input: { comparator: "not_equals" } });
    await runMutation(() => useDeleteLogicRuleMutation(1), 9);

    await runMutation(() => useUpdateFormSettingsMutation(1), { closeAt: null });
    await runMutation(() => useUpdateFormThemeMutation(1), { patch: { primaryColor: "#fff" } });

    expect(formServiceMock.createSection).toHaveBeenCalledWith(1, { title: "S1" });
    expect(formServiceMock.updateSection).toHaveBeenCalledWith(2, { title: "S1b" });
    expect(formServiceMock.deleteSection).toHaveBeenCalledWith(2);
    expect(formServiceMock.reorderSections).toHaveBeenCalledWith(1, [2, 3]);

    expect(formServiceMock.createQuestion).toHaveBeenCalledWith(1, { type: "text" });
    expect(formServiceMock.updateQuestion).toHaveBeenCalledWith(4, { title: "Q" });
    expect(formServiceMock.deleteQuestion).toHaveBeenCalledWith(4);
    expect(formServiceMock.reorderQuestions).toHaveBeenCalledWith(1, [4, 5], 2);

    expect(formServiceMock.createLogicRule).toHaveBeenCalledWith(1, {
      targetQuestionId: 4,
      sourceQuestionId: 5,
      comparator: "equals",
    });
    expect(formServiceMock.updateLogicRule).toHaveBeenCalledWith(9, { comparator: "not_equals" });
    expect(formServiceMock.deleteLogicRule).toHaveBeenCalledWith(9);

    expect(formServiceMock.updateSettings).toHaveBeenCalledWith(1, { closeAt: null });
    expect(formServiceMock.updateTheme).toHaveBeenCalledWith(1, { primaryColor: "#fff" }, undefined);
  });
});
