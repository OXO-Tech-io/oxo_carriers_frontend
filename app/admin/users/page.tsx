"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";
import api from "@/lib/api";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  KeyIcon,
  UserGroupIcon,
  FunnelIcon,
  DocumentTextIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import { UserRole, EmployeeStatus, Vendor } from "@/types";
import CreateUserModal, {
  CreateEmployeeProfilePayload,
} from "@/components/modals/CreateUserModal";
import CreateServiceProviderModal, {
  CreateServiceProviderPayload,
} from "@/components/modals/CreateServiceProviderModal";
import ResetPasswordModal from "@/components/modals/ResetPasswordModal";
import { EmployeeNotesModal } from "@/components/modals/EmployeeNotesModal";
import { DocumentVaultModal } from "@/components/modals/DocumentVaultModal";
import { mapDbUserToAppUser } from "@/lib/mappers/user.mapper";

// GET /users is driven by the local employee table, cross-referenced against
// Keycloak status where available (see users.service.ts#getAll) - the
// employee fields we display live under `employee`, not at the top level.
interface KeycloakUserRow {
  keycloakId: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  emailVerified: boolean;
  requiredActions: string[];
  employee: Parameters<typeof mapDbUserToAppUser>[0];
}

interface User {
  id: number;
  employee_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  status?: EmployeeStatus;
  department?: string;
  position?: string;
  hire_date?: string;
  requiredActions: string[];
  created_at: string;
}

function isVendor(item: User | Vendor): item is Vendor {
  return "company_name" in item && !("role" in item);
}

function statusLabel(status?: EmployeeStatus): string {
  if (status === EmployeeStatus.INACTIVE) return "Inactive";
  if (status === EmployeeStatus.ON_HOLD) return "On Hold";
  return "Active";
}

function statusBadgeClass(status?: EmployeeStatus): string {
  if (status === EmployeeStatus.INACTIVE) return "bg-red-100 text-red-700";
  if (status === EmployeeStatus.ON_HOLD) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function AdminUsersPage() {
  const { user: currentUser, isHR, isFinance, isSuperAdmin } = useAuth();
  const toast = useToast();
  const canAccessUsers = isSuperAdmin || isHR || isFinance;
  const [listItems, setListItems] = useState<(User | Vendor)[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateServiceProviderModal, setShowCreateServiceProviderModal] =
    useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showDocumentVaultModal, setShowDocumentVaultModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const canManageNotes =
    currentUser?.role === UserRole.HR_EXECUTIVE ||
    currentUser?.role === UserRole.HR_MANAGER ||
    isSuperAdmin;
  const canManageDocumentVault = canManageNotes;
  const canManageStatus =
    currentUser?.role === UserRole.HR_EXECUTIVE ||
    currentUser?.role === UserRole.HR_MANAGER ||
    isSuperAdmin;
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("");
  const [filterDepartment, setFilterDepartment] = useState<string>("");
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    if (canAccessUsers) {
      fetchUsers();
      if (!isFinance) fetchDepartments();
    }
    // filterRole/filterDepartment are applied client-side (see filteredItems
    // below), not refetched - the backend doesn't support those filters.
  }, [canAccessUsers, isFinance, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      if (isFinance) {
        const params = new URLSearchParams();
        if (searchTerm) params.append("search", searchTerm);
        const response = await api.get(`/vendors?${params.toString()}`);
        setListItems(response.data.vendors || []);
      } else {
        // The backend only supports filtering by `search` - role/department
        // filters are applied client-side below.
        const params = new URLSearchParams();
        if (searchTerm) params.append("search", searchTerm);
        const response = await api.get(`/users?${params.toString()}`);
        const rows: KeycloakUserRow[] = response.data.users || [];
        const mapped = rows
          .filter((row) => row.employee)
          .map((row) => {
            const employee = mapDbUserToAppUser(row.employee)!;
            return {
              ...employee,
              role: employee.role as UserRole,
              status: employee.status as EmployeeStatus | undefined,
              requiredActions: row.requiredActions ?? [],
            };
          });
        setListItems(mapped);
      }
    } catch (err: any) {
      console.error("Failed to fetch:", err);
      toast.error(
        "Failed to load",
        err.response?.data?.message || "Could not fetch users",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/users/departments");
      setDepartments(response.data.departments || []);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  };

  const handleCreateUser = async (formData: {
    employee_id?: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    department: string;
    position: string;
    hire_date: string;
    manager_id: string;
    hourly_rate?: string;
    bank_name?: string;
    account_holder_name?: string;
    account_number?: string;
    bank_branch?: string;
    bank_branch_code?: string;
    swift_code?: string;
    company_name?: string;
    contact_number?: string;
    profile?: CreateEmployeeProfilePayload;
  }) => {
    let createdUser: any = null;
    try {
      // 1. Save to Database
      const response = await api.post("/users", formData);
      createdUser = response.data.user;
      toast.success(
        "User Created in Database",
        "Employee record saved successfully."
      );
    } catch (err: any) {
      toast.error(
        "Failed to create user",
        err.response?.data?.message || "Please check the form and try again",
      );
      throw err; // Re-throw to let modal handle loading state and remain open
    }

    // 2. Provision in Keycloak (skip for service providers/vendors)
    if (createdUser && formData.role !== UserRole.SERVICE_PROVIDER) {
      try {
        const kcResponse = await api.post(`/users/${createdUser.id}/keycloak-accounts`);
        toast.success(
          "Keycloak Provisioned",
          kcResponse.data.message || "Keycloak identity provisioned successfully and email sent."
        );
      } catch (kcErr: any) {
        console.error("Keycloak provisioning failed:", kcErr);
        toast.error(
          "Keycloak Provisioning Failed",
          kcErr.response?.data?.message || "Failed to create Keycloak identity. You can retry via Reset Password."
        );
      }
    }

    setShowCreateModal(false);
    fetchUsers();
  };

  const handleCreateServiceProvider = async (
    data: CreateServiceProviderPayload,
  ) => {
    try {
      const response = await api.post("/vendors", data);
      toast.success(
        "Vendor created",
        response.data.message ||
          "Service provider account created successfully",
      );
      setShowCreateServiceProviderModal(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(
        "Failed to create vendor",
        err.response?.data?.message || "Please check the form and try again",
      );
      throw err;
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    try {
      const response = await api.post(
        `/users/${selectedUser.id}/password-resets`,
      );
      toast.success(
        "Password reset sent",
        response.data.message || `Reset email sent to ${selectedUser.email}`,
      );
      setShowResetModal(false);
      setSelectedUser(null);
    } catch (err: any) {
      toast.error(
        "Failed to reset password",
        err.response?.data?.message || "Could not send reset email",
      );
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? Their personal data and Keycloak login will be removed and the account deactivated, but other records (leave, salary, attendance, etc.) will be kept. This action cannot be undone.",
      )
    ) {
      return;
    }
    try {
      await api.delete(`/users/${userId}`);
      toast.success(
        "User deleted",
        "Personal data and Keycloak access have been removed; the account is now inactive",
      );
      fetchUsers();
    } catch (err: any) {
      toast.error(
        "Failed to delete user",
        err.response?.data?.message || "Could not delete the user",
      );
    }
  };

  const handleStatusChange = async (userId: number, status: EmployeeStatus) => {
    try {
      await api.patch(`/users/${userId}/status`, { status });
      toast.success("Status updated", "The employee's account status has been changed");
      fetchUsers();
    } catch (err: any) {
      toast.error(
        "Failed to update status",
        err.response?.data?.message || "Could not update the employee's status",
      );
    }
  };

  const filteredItems = listItems.filter((item) => {
    if (isVendor(item)) return true;
    if (filterRole && item.role !== filterRole) return false;
    if (filterDepartment && item.department !== filterDepartment) return false;
    return true;
  });

  if (!canAccessUsers) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-lg font-semibold text-[#101828]">Access Denied</p>
          <p className="text-[#475467]">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#101828]">
            {isFinance ? "Service Providers" : "Employee Management"}
          </h1>
          <p className="mt-2 text-[#475467]">
            {isFinance
              ? "Create and manage service provider accounts"
              : "Create and manage employee accounts"}
          </p>
        </div>
        {(isHR || isFinance || isSuperAdmin) && (
          <div className="flex items-center gap-2">
            {isFinance && (
              <button
                onClick={() => setShowCreateServiceProviderModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#465FFF] text-white rounded-xl font-semibold hover:bg-[#3641F5] transition-colors shadow-sm hover:shadow-md"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Create Service Provider</span>
              </button>
            )}
            {(isHR || isSuperAdmin) && (
              <>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#465FFF] text-white rounded-xl font-semibold hover:bg-[#3641F5] transition-colors shadow-sm hover:shadow-md"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Create Employee</span>
                </button>
                <button
                  onClick={() => setShowCreateServiceProviderModal(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white border border-[#D0D5DD] text-[#344054] rounded-xl font-semibold hover:bg-[#F9FAFB] transition-colors shadow-sm"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Create Service Provider</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-4">
        <div
          className={`grid grid-cols-1 gap-4 ${isHR || isSuperAdmin ? "md:grid-cols-3" : ""}`}
        >
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-[#98A2B3]" />
            </div>
            <input
              type="text"
              placeholder={
                isFinance
                  ? "Search service providers..."
                  : "Search employees..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
            />
          </div>
          {(isHR || isSuperAdmin) && (
            <>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm font-medium text-[#344054] bg-white focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
              >
                <option value="">All Roles</option>
                <option value={UserRole.HR_MANAGER}>HR Manager</option>
                <option value={UserRole.HR_EXECUTIVE}>HR Executive</option>
                <option value={UserRole.FINANCE_MANAGER}>
                  Finance Manager
                </option>
                <option value={UserRole.FINANCE_EXECUTIVE}>
                  Finance Executive
                </option>
                <option value={UserRole.EMPLOYEE}>Employee</option>
                <option value={UserRole.CONSULTANT}>Consultant</option>
                <option value={UserRole.SERVICE_PROVIDER}>
                  Service Provider
                </option>
              </select>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm font-medium text-[#344054] bg-white focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#465FFF] border-t-transparent"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E4E7EC]">
              <thead className="bg-[#F9FAFB]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">
                    {isFinance ? "Company" : "Employee"}
                  </th>
                  {!isFinance && (
                    <>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">
                        Onboarding
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">
                        Account Status
                      </th>
                    </>
                  )}
                  {isFinance && (
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">
                      Contact
                    </th>
                  )}
                  {!isFinance && (
                    <th className="px-6 py-4 text-right text-xs font-bold text-[#344054] uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E4E7EC]">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isFinance ? 2 : 7}
                      className="px-6 py-12 text-center"
                    >
                      <UserGroupIcon className="h-12 w-12 text-[#98A2B3] mx-auto mb-4" />
                      <p className="text-sm font-medium text-[#344054]">
                        {isFinance ? "No vendors found" : "No employees found"}
                      </p>
                      <p className="text-sm text-[#98A2B3] mt-1">
                        {isFinance
                          ? "Try adjusting your search"
                          : "Try adjusting your search or filters"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) =>
                    isVendor(item) ? (
                      <tr
                        key={item.id}
                        className="hover:bg-[#F9FAFB] transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-semibold text-[#101828]">
                              {item.company_name}
                            </p>
                            <p className="text-xs text-[#475467]">
                              {item.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475467]">
                          {item.contact_number || "—"}
                        </td>
                      </tr>
                    ) : (
                      <tr
                        key={item.id}
                        className="hover:bg-[#F9FAFB] transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-semibold text-[#101828]">
                              {item.first_name} {item.last_name}
                            </p>
                            <p className="text-xs text-[#475467]">
                              {item.email}
                            </p>
                            <p className="text-xs text-[#98A2B3] mt-0.5">
                              ID: {item.employee_id}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#ECF3FF] text-[#465FFF]">
                            {item.role.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475467]">
                          {item.department || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475467]">
                          {item.position || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.requiredActions.includes("UPDATE_PASSWORD") ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              Password Setup Required
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {canManageStatus && currentUser?.id !== item.id ? (
                            <select
                              value={item.status ?? EmployeeStatus.ACTIVE}
                              onChange={(e) =>
                                handleStatusChange(item.id, e.target.value as EmployeeStatus)
                              }
                              className={`text-xs font-semibold rounded-full px-2.5 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-[#465FFF] cursor-pointer ${statusBadgeClass(item.status)}`}
                            >
                              <option value={EmployeeStatus.ACTIVE}>Active</option>
                              <option value={EmployeeStatus.INACTIVE}>Inactive</option>
                              <option value={EmployeeStatus.ON_HOLD}>On Hold</option>
                            </select>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(item.status)}`}
                            >
                              {statusLabel(item.status)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {canManageNotes && (
                              <button
                                onClick={() => {
                                  setSelectedUser(item);
                                  setShowNotesModal(true);
                                }}
                                className="p-2 text-[#465FFF] hover:bg-[#ECF3FF] rounded-lg transition-colors"
                                title="Employee Notes"
                              >
                                <DocumentTextIcon className="h-5 w-5" />
                              </button>
                            )}
                            {canManageDocumentVault && !isVendor(item) && (
                              <button
                                onClick={() => {
                                  setSelectedUser(item);
                                  setShowDocumentVaultModal(true);
                                }}
                                className="p-2 text-[#465FFF] hover:bg-[#ECF3FF] rounded-lg transition-colors"
                                title="Document Vault"
                              >
                                <FolderIcon className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedUser(item);
                                setShowResetModal(true);
                              }}
                              className="p-2 text-[#465FFF] hover:bg-[#ECF3FF] rounded-lg transition-colors"
                              title="Reset Password"
                            >
                              <KeyIcon className="h-5 w-5" />
                            </button>
                            {(currentUser?.role === UserRole.HR_MANAGER || isSuperAdmin) && (
                              <button
                                onClick={() => handleDeleteUser(item.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete User"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal (HR only - employees/consultants) */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateUser}
        currentUserRole={currentUser?.role as UserRole | undefined}
      />

      {/* Create Service Provider Modal */}
      <CreateServiceProviderModal
        isOpen={showCreateServiceProviderModal}
        onClose={() => setShowCreateServiceProviderModal(false)}
        onSubmit={handleCreateServiceProvider}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={showResetModal}
        onClose={() => {
          setShowResetModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleResetPassword}
        userEmail={selectedUser?.email || ""}
      />

      {/* Employee Notes Modal (HR Team can add-only; HR Manager can view/edit) */}
      {selectedUser && !isVendor(selectedUser) && (
        <EmployeeNotesModal
          isOpen={showNotesModal}
          onClose={() => {
            setShowNotesModal(false);
            setSelectedUser(null);
          }}
          employeeId={selectedUser.id}
          employeeName={`${selectedUser.first_name} ${selectedUser.last_name}`}
        />
      )}

      {/* Document Vault Modal */}
      {selectedUser && !isVendor(selectedUser) && (
        <DocumentVaultModal
          isOpen={showDocumentVaultModal}
          onClose={() => {
            setShowDocumentVaultModal(false);
            setSelectedUser(null);
          }}
          employeeId={selectedUser.id}
          employeeName={`${selectedUser.first_name} ${selectedUser.last_name}`}
        />
      )}
    </div>
  );
}
