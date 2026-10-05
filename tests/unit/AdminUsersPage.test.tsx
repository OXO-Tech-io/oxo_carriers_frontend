import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import AdminUsersPage from "@/app/admin/users/page";
import { UserRole } from "@/types";

const { apiMock, useAuthMock, useMyPermissionLevelMock, toastMock } = vi.hoisted(() => ({
  apiMock: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  useAuthMock: vi.fn(),
  useMyPermissionLevelMock: vi.fn(),
  toastMock: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/api", () => ({ default: apiMock }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: useAuthMock }));
vi.mock("@/hooks/useMyPermissionLevel", () => ({ useMyPermissionLevel: useMyPermissionLevelMock }));
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
    // Default: no document_vault 'write' (HR Manager/HR Executive get 'read' only).
    useMyPermissionLevelMock.mockReturnValue({ allowed: false, loaded: true });
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

  // Document Vault upload is Super Admin only by default (document_vault
  // 'write'); HR Manager and HR Executive only get 'read'. The row icon that
  // opens DocumentVaultModal follows that permission and is absent entirely
  // without it, not just present-but-disabled.
  it.each([
    ["HR Manager", UserRole.HR_MANAGER],
    ["HR Executive", UserRole.HR_EXECUTIVE],
  ])("hides the Document Vault icon for %s (no document_vault write)", async (_label, role) => {
    mockAuth(role);
    render(<AdminUsersPage />);
    await screen.findByText("Jane Doe");
    expect(screen.queryByTitle("Document Vault")).not.toBeInTheDocument();
  });

  it("shows the Document Vault icon for a user who holds document_vault write (Super Admin)", async () => {
    mockAuth(UserRole.SUPER_ADMIN);
    useMyPermissionLevelMock.mockReturnValue({ allowed: true, loaded: true });
    render(<AdminUsersPage />);
    expect((await screen.findAllByTitle("Document Vault")).length).toBeGreaterThan(0);
    expect(useMyPermissionLevelMock).toHaveBeenCalledWith("document_vault", "write");
  });

  it("moving the status slider patches the new status and shows a toast (Super Admin only)", async () => {
    mockAuth(UserRole.SUPER_ADMIN);
    apiMock.patch.mockResolvedValue({});
    render(<AdminUsersPage />);

    await screen.findByText("Jane Doe");
    const row = screen.getByText("Jane Doe").closest("tr")!;
    const statusSlider = within(row).getByRole("slider", { name: "Account status for Jane Doe" });
    expect(statusSlider).toHaveAttribute("aria-valuetext", "Active");
    fireEvent.keyDown(statusSlider, { key: "End" });

    await waitFor(() =>
      expect(apiMock.patch).toHaveBeenCalledWith("/users/10/statuses", { status: "inactive" }),
    );
    expect(toastMock.success).toHaveBeenCalledWith(
      "Status updated",
      "The employee's account status has been changed",
    );
  });

  it("puts the slider back on the current status when the update fails", async () => {
    mockAuth(UserRole.SUPER_ADMIN);
    apiMock.patch.mockRejectedValue({ response: { data: { message: "Nope" } } });
    render(<AdminUsersPage />);

    await screen.findByText("Jane Doe");
    const row = screen.getByText("Jane Doe").closest("tr")!;
    const statusSlider = within(row).getByRole("slider");
    fireEvent.keyDown(statusSlider, { key: "End" });

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Failed to update status", "Nope"));
    await waitFor(() => expect(statusSlider).toHaveAttribute("aria-valuetext", "Active"));
  });

  it("shows Account Status as a read-only badge (no slider) for HR Manager and HR Executive", async () => {
    mockAuth(UserRole.HR_MANAGER);
    render(<AdminUsersPage />);

    await screen.findByText("Jane Doe");
    const row = screen.getByText("Jane Doe").closest("tr")!;
    expect(within(row).queryByRole("slider")).not.toBeInTheDocument();
    // Onboarding badge + the read-only Account Status badge.
    expect(within(row).getAllByText("Active")).toHaveLength(2);
  });
});
