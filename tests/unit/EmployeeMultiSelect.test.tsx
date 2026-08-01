import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EmployeeMultiSelect } from "@/components/ui/EmployeeMultiSelect";

const { userDirectoryServiceMock } = vi.hoisted(() => ({
  userDirectoryServiceMock: { list: vi.fn() },
}));

vi.mock("@/lib/services/user-directory.service", () => ({
  userDirectoryService: userDirectoryServiceMock,
}));

const employees = [
  { id: 1, email: "a@a.com", first_name: "Alice", last_name: "Anderson", employee_id: "E1", department: "IT", role: "employee" },
  { id: 2, email: "b@b.com", first_name: "Bob", last_name: "Brown", employee_id: "E2", department: "HR", role: "employee" },
];

describe("EmployeeMultiSelect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userDirectoryServiceMock.list.mockResolvedValue(employees);
  });

  it("loads and lists employees, showing a loading state first", async () => {
    render(<EmployeeMultiSelect selectedIds={[]} onChange={vi.fn()} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText(/Alice Anderson/)).toBeInTheDocument());
    expect(screen.getByText(/Bob Brown/)).toBeInTheDocument();
    expect(userDirectoryServiceMock.list).toHaveBeenCalledWith({ search: undefined });
  });

  it("shows a 'no employees found' message when the list is empty", async () => {
    userDirectoryServiceMock.list.mockResolvedValue([]);
    render(<EmployeeMultiSelect selectedIds={[]} onChange={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("No employees found")).toBeInTheDocument());
  });

  it("toggling a checkbox calls onChange with the updated id list", async () => {
    const onChange = vi.fn();
    render(<EmployeeMultiSelect selectedIds={[1]} onChange={onChange} />);
    await waitFor(() => expect(screen.getByText(/Alice Anderson/)).toBeInTheDocument());

    const checkboxes = screen.getAllByRole("checkbox");
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);

    fireEvent.click(checkboxes[0]); // uncheck Alice (already selected)
    expect(onChange).toHaveBeenCalledWith([]);

    fireEvent.click(checkboxes[1]); // check Bob
    expect(onChange).toHaveBeenCalledWith([1, 2]);
  });

  it("re-fetches when the search text changes", async () => {
    render(<EmployeeMultiSelect selectedIds={[]} onChange={vi.fn()} />);
    await waitFor(() => expect(userDirectoryServiceMock.list).toHaveBeenCalledWith({ search: undefined }));

    fireEvent.change(screen.getByPlaceholderText(/Search employees/), { target: { value: "ali" } });
    await waitFor(() =>
      expect(userDirectoryServiceMock.list).toHaveBeenCalledWith({ search: "ali" }),
    );
  });

  it("shows a selected-count summary once at least one employee is selected", async () => {
    render(<EmployeeMultiSelect selectedIds={[1, 2]} onChange={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/Alice Anderson/)).toBeInTheDocument());
    expect(screen.getByText("2 employee(s) selected")).toBeInTheDocument();
  });
});
