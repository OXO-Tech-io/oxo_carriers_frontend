import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import AdminUsersPage from "@/app/admin/users/page";
import { UserRole } from "@/types";

const { apiMock, useAuthMock, toastMock } = vi.hoisted(() => ({
  apiMock: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  useAuthMock: vi.fn(),
  toastMock: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/api", () => ({ default: apiMock }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: useAuthMock }));
vi.mock("@/contexts/ToastContext", () => ({ useToast: () => toastMock }));

// These modals pull in react-hook-form/wizard steps unrelated to the
// list/delete/status behavior under test here - stub them to plain markers.
vi.mock("@/components/modals/CreateUserModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>CreateUserModal</div> : null),
}));
vi.mock("@/components/modals/CreateServiceProviderModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>CreateServiceProviderModal</div> : null),
}));
vi.mock("@/components/modals/ResetPasswordModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>ResetPasswordModal</div> : null),
}));
vi.mock("@/components/modals/EmployeeNotesModal", () => ({
  EmployeeNotesModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>EmployeeNotesModal</div> : null),
}));

function employeeRow(overrides: Partial<Record<string, any>> = {}) {
  return {
    keycloakId: "kc-10",
    email: "jane@oxo.test",
    firstName: "Jane",
    lastName: "Doe",
    enabled: true,
    emailVerified: true,
    requiredActions: [],
    employee: {
      id: 10,
      employeeId: "EMP2026001",
      email: "jane@oxo.test",
      firstName: "Jane",
      lastName: "Doe",
      role: UserRole.EMPLOYEE,
      status: "active",
      department: "Engineering",
      position: "Developer",
      hireDate: "2024-01-01",
      createdAt: "2024-01-01T00:00:00.000Z",
      ...overrides,
    },
  };
}

function mockAuth(role: UserRole, overrides: Partial<Record<string, any>> = {}) {
  useAuthMock.mockReturnValue({
    user: { id: 1, role },
    isHR: role === UserRole.HR_MANAGER || role === UserRole.HR_EXECUTIVE,
    isFinance: false,
    isSuperAdmin: role === UserRole.SUPER_ADMIN,
    ...overrides,
  });
}

describe("AdminUsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.get.mockImplementation((url: string) => {
      if (url.startsWith("/users/departments")) {
        return Promise.resolve({ data: { departments: ["Engineering"] } });
      }
      return Promise.resolve({ data: { users: [employeeRow()] } });
    });
  });

  it("shows Access Denied for a role without access", () => {
    mockAuth(UserRole.EMPLOYEE, { isHR: false, isSuperAdmin: false });
    render(<AdminUsersPage />);
    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(apiMock.get).not.toHaveBeenCalled();
  });

  it("loads and lists employees for an HR manager", async () => {
    mockAuth(UserRole.HR_MANAGER);
    render(<AdminUsersPage />);
    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@oxo.test")).toBeInTheDocument();
  });

  // OCD-437: the browser-native confirm() is gone - deleting now opens the
  // app-styled ConfirmationDialog (title "Delete Employee", Delete/Cancel
  // actions), which the OCD-453 archive wording is layered onto.
  it("deletes only PII/Keycloak data and deactivates the account, leaving other records untouched", async () => {
    mockAuth(UserRole.HR_MANAGER);
    apiMock.delete.mockResolvedValue({});
    render(<AdminUsersPage />);

    await screen.findByText("Jane Doe");
    fireEvent.click(screen.getByTitle("Delete User"));

    expect(screen.getByText("Delete Employee")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(apiMock.delete).toHaveBeenCalledWith("/users/10"));
    expect(toastMock.success).toHaveBeenCalledWith(
      "User deleted",
      "The employee has been moved to the Archive; their personal data and Keycloak access have been removed and the account is now inactive.",
    );
    // fetchUsers (GET /users?...) runs again after a successful delete, on
    // top of the initial load and the one-off departments fetch
    await waitFor(() =>
      expect(apiMock.get.mock.calls.filter(([url]) => url.startsWith("/users?"))).toHaveLength(2),
    );
  });

  it("does not call delete when the confirmation is dismissed", async () => {
    mockAuth(UserRole.HR_MANAGER);
    render(<AdminUsersPage />);

    await screen.findByText("Jane Doe");
    fireEvent.click(screen.getByTitle("Delete User"));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(apiMock.delete).not.toHaveBeenCalled();
  });

  it("surfaces a failure toast without crashing when the delete request fails", async () => {
    mockAuth(UserRole.HR_MANAGER);
    apiMock.delete.mockRejectedValue({ response: { data: { message: "boom" } } });
    render(<AdminUsersPage />);

    await screen.findByText("Jane Doe");
    fireEvent.click(screen.getByTitle("Delete User"));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith("Failed to delete user", "boom"),
    );
  });

  it("hides the delete action for HR executives (only HR Manager/Super Admin can delete)", async () => {
    mockAuth(UserRole.HR_EXECUTIVE);
    render(<AdminUsersPage />);
    await screen.findByText("Jane Doe");
    expect(screen.queryByTitle("Delete User")).not.toBeInTheDocument();
  });

  it("changing the status dropdown patches the new status and shows a toast (Super Admin only)", async () => {
    mockAuth(UserRole.SUPER_ADMIN);
    apiMock.patch.mockResolvedValue({});
    render(<AdminUsersPage />);

    await screen.findByText("Jane Doe");
    const row = screen.getByText("Jane Doe").closest("tr")!;
    const statusSelect = within(row).getByRole("combobox");
    fireEvent.change(statusSelect, { target: { value: "inactive" } });

    await waitFor(() =>
      expect(apiMock.patch).toHaveBeenCalledWith("/users/10/statuses", { status: "inactive" }),
    );
    expect(toastMock.success).toHaveBeenCalledWith(
      "Status updated",
      "The employee's account status has been changed",
    );
  });

  it("shows Account Status as a read-only badge (no dropdown) for HR Manager and HR Executive", async () => {
    mockAuth(UserRole.HR_MANAGER);
    render(<AdminUsersPage />);

    await screen.findByText("Jane Doe");
    const row = screen.getByText("Jane Doe").closest("tr")!;
    expect(within(row).queryByRole("combobox")).not.toBeInTheDocument();
  });
});
