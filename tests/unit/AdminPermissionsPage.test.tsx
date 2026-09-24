import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import PermissionsPage from "@/app/admin/permissions/page";

const { apiMock, useAuthMock, toastMock } = vi.hoisted(() => ({
  apiMock: { get: vi.fn(), put: vi.fn(), patch: vi.fn() },
  useAuthMock: vi.fn(),
  toastMock: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/api", () => ({ default: apiMock }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: useAuthMock }));
vi.mock("@/contexts/ToastContext", () => ({ useToast: () => toastMock }));

const CATALOG = [
  { key: "leaves", label: "Leaves", description: "Manage leave requests.", group: "leaves" },
  { key: "salaries", label: "Salaries", description: "Manage salary data.", group: "salaries" },
];

const MANAGEABLE_USERS = [
  { id: 2, email: "jane@oxo.test", first_name: "Jane", last_name: "Doe", role: "employee" },
];

function mockGet(overrides: Partial<Record<string, any>> = {}) {
  apiMock.get.mockImplementation((url: string) => {
    if (url === "/permissions/manageable-users") {
      return Promise.resolve({ data: { users: overrides.users ?? MANAGEABLE_USERS } });
    }
    if (url === "/permissions/catalog") {
      return Promise.resolve({ data: { permissions: overrides.catalog ?? CATALOG } });
    }
    if (url === "/permissions/users") {
      return Promise.resolve({
        data: { assignments: overrides.userAssignments ?? { 2: [{ key: "leaves", accessLevel: "read" }] } },
      });
    }
    if (url === "/permissions/roles") {
      return Promise.resolve({
        data: {
          // ROLE_DEFAULT_ROLES order: hr_manager, hr_executive, finance_manager,
          // finance_executive, employee, consultant, service_provider - the
          // page auto-selects the first (hr_manager) on load.
          roles: overrides.roleDefaults ?? [
            { role: "hr_manager", assignments: [{ key: "leaves", accessLevel: "write" }] },
            { role: "hr_executive", assignments: [] },
            { role: "finance_manager", assignments: [] },
            { role: "finance_executive", assignments: [] },
            { role: "employee", assignments: [{ key: "leaves", accessLevel: "read" }] },
            { role: "consultant", assignments: [] },
            { role: "service_provider", assignments: [] },
          ],
        },
      });
    }
    return Promise.resolve({ data: {} });
  });
}

// Access-level control buttons carry an explicit aria-label of
// "<permission label> — <option>", so they're unambiguous regardless of
// which entity (user or role) is currently selected.
const accessButton = (permissionLabel: string, level: "None" | "Read" | "Write") =>
  screen.getByRole("button", { name: `${permissionLabel} — ${level}` });

// The list row and the detail panel both render the selected entity's name/
// label as plain text, so an unscoped query is ambiguous - scope to the
// detail panel via its heading role instead.
const detailHeading = (name: string) =>
  within(screen.getByTestId("detail-panel")).getByRole("heading", { name });

describe("Admin Permissions Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Super admin skips the /permissions/me round trip entirely and is
    // granted write access immediately (see resolveAccess in the page).
    useAuthMock.mockReturnValue({ user: { id: 1 }, isSuperAdmin: true });
    mockGet();
  });

  it("shows Access Denied for a role without read access to permissions", async () => {
    useAuthMock.mockReturnValue({ user: { id: 1 }, isSuperAdmin: false });
    apiMock.get.mockImplementation((url: string) => {
      if (url === "/permissions/me") return Promise.resolve({ data: { permissionLevels: {} } });
      return Promise.resolve({ data: {} });
    });
    render(<PermissionsPage />);
    await waitFor(() => expect(screen.getByText("Access Denied")).toBeInTheDocument());
  });

  it("defaults to the Per-User Permissions tab, auto-selects the first user, and shows their permissions", async () => {
    render(<PermissionsPage />);
    await waitFor(() => expect(detailHeading("Jane Doe")).toBeInTheDocument());
    // Jane's seeded assignment is leaves:read.
    expect(accessButton("Leaves", "Read").getAttribute("aria-pressed")).toBe("true");
    expect(accessButton("Leaves", "Write").getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("Save Permissions")).toBeInTheDocument();
  });

  it("switches to the Role Defaults tab, auto-selects the first role, and lists every role except Super Admin", async () => {
    render(<PermissionsPage />);
    await waitFor(() => expect(detailHeading("Jane Doe")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Role Defaults" }));

    await waitFor(() => expect(detailHeading("HR Manager")).toBeInTheDocument());
    const roleList = within(screen.getByTestId("role-list"));
    expect(roleList.getByText("HR Executive")).toBeInTheDocument();
    expect(roleList.getByText("Employee")).toBeInTheDocument();
    expect(roleList.getByText("Consultant")).toBeInTheDocument();
    expect(roleList.queryByText("Super Admin")).not.toBeInTheDocument();
    expect(screen.getByText("Save Role Defaults")).toBeInTheDocument();
  });

  it("pre-selects the currently configured access level for the selected role", async () => {
    render(<PermissionsPage />);
    await waitFor(() => expect(detailHeading("Jane Doe")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Role Defaults" }));

    // hr_manager (auto-selected first) was seeded with leaves:write.
    await waitFor(() => expect(accessButton("Leaves", "Write").getAttribute("aria-pressed")).toBe("true"));
    expect(accessButton("Leaves", "Read").getAttribute("aria-pressed")).toBe("false");

    // hr_executive has no defaults configured - switching to it shows "None" selected.
    fireEvent.click(within(screen.getByTestId("role-list")).getByText("HR Executive"));
    await waitFor(() => expect(detailHeading("HR Executive")).toBeInTheDocument());
    expect(accessButton("Leaves", "None").getAttribute("aria-pressed")).toBe("true");
  });

  it("toggling a role default and saving calls PUT /permissions/roles/:role with the new grants", async () => {
    render(<PermissionsPage />);
    await waitFor(() => expect(detailHeading("Jane Doe")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Role Defaults" }));
    await waitFor(() => expect(detailHeading("HR Manager")).toBeInTheDocument());

    fireEvent.click(within(screen.getByTestId("role-list")).getByText("HR Executive"));
    await waitFor(() => expect(detailHeading("HR Executive")).toBeInTheDocument());

    // Grant hr_executive read access to salaries (previously ungranted).
    fireEvent.click(accessButton("Salaries", "Read"));

    apiMock.put.mockResolvedValue({ data: { success: true } });
    fireEvent.click(screen.getByText("Save Role Defaults"));

    await waitFor(() =>
      expect(apiMock.put).toHaveBeenCalledWith("/permissions/roles/hr_executive", {
        permissions: [{ key: "salaries", accessLevel: "read" }],
      }),
    );
    expect(toastMock.success).toHaveBeenCalled();
  });

  it("Save Role Defaults stays disabled until something actually changes", async () => {
    render(<PermissionsPage />);
    await waitFor(() => expect(detailHeading("Jane Doe")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Role Defaults" }));
    await waitFor(() => expect(detailHeading("HR Manager")).toBeInTheDocument());

    expect(screen.getByText("Save Role Defaults").closest("button")).toBeDisabled();
  });

  it("editing a role's defaults does not touch any already-created user's permissions", async () => {
    render(<PermissionsPage />);
    await waitFor(() => expect(detailHeading("Jane Doe")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Role Defaults" }));
    await waitFor(() => expect(detailHeading("HR Manager")).toBeInTheDocument());

    fireEvent.click(accessButton("Salaries", "Read"));
    apiMock.put.mockResolvedValue({ data: { success: true } });
    fireEvent.click(screen.getByText("Save Role Defaults"));

    await waitFor(() => expect(apiMock.put).toHaveBeenCalledWith("/permissions/roles/hr_manager", expect.any(Object)));
    // Never calls the per-user endpoint as a side effect of saving role defaults.
    expect(apiMock.put).not.toHaveBeenCalledWith(
      expect.stringMatching(/^\/permissions\/users\//),
      expect.any(Object),
    );
  });

  it("Discard reverts unsaved permission changes for the selected user", async () => {
    render(<PermissionsPage />);
    await waitFor(() => expect(detailHeading("Jane Doe")).toBeInTheDocument());

    fireEvent.click(accessButton("Salaries", "Write"));
    expect(accessButton("Salaries", "Write").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Discard"));
    expect(accessButton("Salaries", "Write").getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
  });

  it("filters the user list by name/email via the search box", async () => {
    mockGet({
      users: [
        ...MANAGEABLE_USERS,
        { id: 3, email: "bob@oxo.test", first_name: "Bob", last_name: "Smith", role: "employee" },
      ],
      userAssignments: { 2: [{ key: "leaves", accessLevel: "read" }], 3: [] },
    });
    render(<PermissionsPage />);
    await waitFor(() => expect(detailHeading("Jane Doe")).toBeInTheDocument());
    const userList = within(screen.getByTestId("user-list"));
    expect(userList.getByText("Bob Smith")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search users..."), { target: { value: "bob" } });

    expect(userList.queryByText("Jane Doe")).not.toBeInTheDocument();
    fireEvent.click(userList.getByText("Bob Smith"));
    await waitFor(() => expect(detailHeading("Bob Smith")).toBeInTheDocument());
  });
});
