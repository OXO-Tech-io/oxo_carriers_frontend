import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, act } from "@testing-library/react";
import { RecipientPicker } from "@/components/ui/RecipientPicker";

const { useGroupsQueryMock, useGroupQueryMock, userDirectoryServiceMock } = vi.hoisted(() => ({
  useGroupsQueryMock: vi.fn(),
  useGroupQueryMock: vi.fn(),
  userDirectoryServiceMock: { list: vi.fn() },
}));

vi.mock("@/hooks/queries/use-groups-query", () => ({
  useGroupsQuery: useGroupsQueryMock,
  useGroupQuery: useGroupQueryMock,
}));

vi.mock("@/lib/services/user-directory.service", () => ({
  userDirectoryService: userDirectoryServiceMock,
}));

const groups = [
  { id: 1, name: "Engineering", memberCount: 2 },
  { id: 2, name: "Sales", memberCount: 0 },
];

const members = [
  { id: 10, userId: 100, firstName: "Alice", lastName: "Anderson", email: "a@a.com" },
  { id: 11, userId: 101, firstName: "Bob", lastName: "Brown", email: "b@b.com" },
];

// The nested EmployeeMultiSelect kicks off its own userDirectoryService.list() fetch on mount;
// flushing it after render keeps that unrelated state update from leaking into later tests as an
// "not wrapped in act()" warning.
const flushEmployeeFetch = () => act(() => Promise.resolve());

describe("RecipientPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGroupsQueryMock.mockReturnValue({ data: groups, isLoading: false });
    useGroupQueryMock.mockReturnValue({ data: { members }, isLoading: false });
    userDirectoryServiceMock.list.mockResolvedValue([]);
  });

  it("lists groups and shows a selected-count summary", async () => {
    render(
      <RecipientPicker
        selectedGroupIds={[1]}
        onGroupIdsChange={vi.fn()}
        selectedUserIds={[]}
        onUserIdsChange={vi.fn()}
        onGroupMemberIdsChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/Engineering/)).toBeInTheDocument();
    expect(screen.getByText(/Sales/)).toBeInTheDocument();
    expect(screen.getByText("1 group(s) selected")).toBeInTheDocument();
    await flushEmployeeFetch();
  });

  it("checking a group toggles it via onGroupIdsChange and expands its member checklist", async () => {
    const onGroupIdsChange = vi.fn();
    render(
      <RecipientPicker
        selectedGroupIds={[]}
        onGroupIdsChange={onGroupIdsChange}
        selectedUserIds={[]}
        onUserIdsChange={vi.fn()}
        onGroupMemberIdsChange={vi.fn()}
      />,
    );
    const engineeringCheckbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(engineeringCheckbox);
    expect(onGroupIdsChange).toHaveBeenCalledWith([1]);
    await flushEmployeeFetch();
  });

  it("shows the member checklist and reports resolved member ids, honoring exclusions", async () => {
    const onGroupMemberIdsChange = vi.fn();
    render(
      <RecipientPicker
        selectedGroupIds={[1]}
        onGroupIdsChange={vi.fn()}
        selectedUserIds={[]}
        onUserIdsChange={vi.fn()}
        onGroupMemberIdsChange={onGroupMemberIdsChange}
      />,
    );
    await waitFor(() =>
      expect(onGroupMemberIdsChange).toHaveBeenCalledWith(expect.arrayContaining([100, 101])),
    );

    const aliceCheckbox = screen.getByText(/Alice Anderson/).closest("label")!.querySelector("input")!;
    fireEvent.click(aliceCheckbox); // exclude Alice
    await waitFor(() => expect(onGroupMemberIdsChange).toHaveBeenLastCalledWith([101]));
  });

  it("unchecking a group removes it and forgets its resolved members", async () => {
    const onGroupIdsChange = vi.fn();
    render(
      <RecipientPicker
        selectedGroupIds={[1]}
        onGroupIdsChange={onGroupIdsChange}
        selectedUserIds={[]}
        onUserIdsChange={vi.fn()}
        onGroupMemberIdsChange={vi.fn()}
      />,
    );
    const engineeringCheckbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(engineeringCheckbox); // was checked, now unchecking
    expect(onGroupIdsChange).toHaveBeenCalledWith([]);
    await flushEmployeeFetch();
  });

  it("shows a loading state for groups and an empty state when there are none", async () => {
    // Scoped to the "Groups" section specifically — the nested EmployeeMultiSelect renders its
    // own independent "Loading..." text while its own employee fetch is in flight.
    useGroupsQueryMock.mockReturnValue({ data: [], isLoading: true });
    const { rerender } = render(
      <RecipientPicker
        selectedGroupIds={[]}
        onGroupIdsChange={vi.fn()}
        selectedUserIds={[]}
        onUserIdsChange={vi.fn()}
        onGroupMemberIdsChange={vi.fn()}
      />,
    );
    const groupsSection = screen.getByText("Groups").parentElement!;
    expect(within(groupsSection).getByText("Loading...")).toBeInTheDocument();

    useGroupsQueryMock.mockReturnValue({ data: [], isLoading: false });
    rerender(
      <RecipientPicker
        selectedGroupIds={[]}
        onGroupIdsChange={vi.fn()}
        selectedUserIds={[]}
        onUserIdsChange={vi.fn()}
        onGroupMemberIdsChange={vi.fn()}
      />,
    );
    expect(within(groupsSection).getByText("No groups yet")).toBeInTheDocument();
    await flushEmployeeFetch();
  });

  it("renders the individuals EmployeeMultiSelect section", async () => {
    render(
      <RecipientPicker
        selectedGroupIds={[]}
        onGroupIdsChange={vi.fn()}
        selectedUserIds={[]}
        onUserIdsChange={vi.fn()}
        onGroupMemberIdsChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Individuals")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search employees/)).toBeInTheDocument();
    await flushEmployeeFetch();
  });
});
