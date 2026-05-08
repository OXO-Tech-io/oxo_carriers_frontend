"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";
import api from "@/lib/api";
import { UserRole } from "@/types";
import { ShieldCheckIcon, UserGroupIcon } from "@heroicons/react/24/outline";

interface ManagedUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface PermissionItem {
  key: string;
  label: string;
  description: string;
  group: string;
}

type AccessLevel = "read" | "write";

interface PermissionAssignment {
  key: string;
  accessLevel: AccessLevel;
}

type PermissionLevelMap = Record<string, AccessLevel>;

const ROLES: { value: string; label: string }[] = [
  { value: UserRole.SUPER_ADMIN, label: "Super Admin" },
  { value: UserRole.HR_MANAGER, label: "HR Manager" },
  { value: UserRole.HR_EXECUTIVE, label: "HR Executive" },
  { value: UserRole.FINANCE_MANAGER, label: "Finance Manager" },
  { value: UserRole.FINANCE_EXECUTIVE, label: "Finance Executive" },
  { value: UserRole.EMPLOYEE, label: "Employee" },
  { value: UserRole.CONSULTANT, label: "Consultant" },
  { value: UserRole.SERVICE_PROVIDER, label: "Service Provider" },
];

function PageHeader() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: "var(--primary)" }}
      >
        <ShieldCheckIcon className="h-5 w-5 text-white" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Function Permission Management
        </h1>
        <p className="text-sm text-[var(--gray-500)]">
          Assign feature-level permissions. Role and permissions are saved
          separately.
        </p>
      </div>
    </div>
  );
}

export default function PermissionsPage() {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [catalog, setCatalog] = useState<PermissionItem[]>([]);
  const [assignments, setAssignments] = useState<
    Record<number, PermissionLevelMap>
  >({});
  const [pendingRoles, setPendingRoles] = useState<Record<number, string>>({});
  const [pendingPermissions, setPendingPermissions] = useState<
    Record<number, PermissionLevelMap>
  >({});
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [accessLoading, setAccessLoading] = useState(true);
  const [permissionsAccessLevel, setPermissionsAccessLevel] =
    useState<AccessLevel | null>(null);
  const [savingRoleUserId, setSavingRoleUserId] = useState<number | null>(null);
  const [savingPermissionUserId, setSavingPermissionUserId] = useState<
    number | null
  >(null);

  const canReadPermissions =
    isSuperAdmin ||
    permissionsAccessLevel === "read" ||
    permissionsAccessLevel === "write";
  const canWritePermissions =
    isSuperAdmin || permissionsAccessLevel === "write";

  useEffect(() => {
    const resolveAccess = async () => {
      if (isSuperAdmin) {
        setPermissionsAccessLevel("write");
        setAccessLoading(false);
        return;
      }

      if (!currentUser) {
        setPermissionsAccessLevel(null);
        setAccessLoading(false);
        return;
      }

      try {
        setAccessLoading(true);
        const res = await api.get("/permissions/me");
        const level = res.data?.permissionLevels?.permissions;
        if (level === "read" || level === "write") {
          setPermissionsAccessLevel(level);
        } else {
          setPermissionsAccessLevel(null);
        }
      } catch {
        setPermissionsAccessLevel(null);
      } finally {
        setAccessLoading(false);
      }
    };

    resolveAccess();
  }, [isSuperAdmin, currentUser?.id]);

  const normalizeAssignments = (raw: Record<number, any>) => {
    const normalized: Record<number, PermissionLevelMap> = {};

    Object.entries(raw || {}).forEach(([userId, value]) => {
      const uid = Number(userId);
      if (!uid || !Array.isArray(value)) {
        return;
      }

      const levels: PermissionLevelMap = {};
      value.forEach((item: any) => {
        if (typeof item === "string") {
          levels[item] = "write";
          return;
        }

        if (
          item &&
          typeof item.key === "string" &&
          (item.accessLevel === "read" || item.accessLevel === "write")
        ) {
          levels[item.key] = item.accessLevel;
        }
      });

      normalized[uid] = levels;
    });

    return normalized;
  };

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");
      const [usersRes, catalogRes, assignmentsRes] = await Promise.all([
        api.get("/permissions/manage-users"),
        api.get("/permissions/catalog"),
        api.get("/permissions/users"),
      ]);

      setUsers(usersRes.data?.users || []);
      setCatalog(catalogRes.data?.permissions || []);
      const normalizedAssignments = normalizeAssignments(
        assignmentsRes.data?.assignments || {},
      );
      setAssignments(normalizedAssignments);
      setPendingPermissions(normalizedAssignments);
    } catch (error: any) {
      setPageError(error.response?.data?.message || error.message);
      toast.error(
        "Failed to load permission data",
        error.response?.data?.message || error.message,
      );
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!accessLoading && canReadPermissions) {
      fetchAll();
    }
  }, [fetchAll, accessLoading, canReadPermissions]);

  const visibleUsers = useMemo(
    () => users.filter((user) => user.id !== currentUser?.id),
    [users, currentUser?.id],
  );

  const togglePermission = (
    userId: number,
    permissionKey: string,
    level: AccessLevel,
    checked: boolean,
  ) => {
    setPendingPermissions((prev) => {
      const current = prev[userId] || {};
      const next = { ...current };

      if (level === "read") {
        if (checked) {
          if (next[permissionKey] !== "write") {
            next[permissionKey] = "read";
          }
        } else {
          delete next[permissionKey];
        }
      }

      if (level === "write") {
        if (checked) {
          next[permissionKey] = "write";
        } else if (next[permissionKey] === "write") {
          next[permissionKey] = "read";
        }
      }

      return {
        ...prev,
        [userId]: next,
      };
    });
  };

  const saveRole = async (user: ManagedUser) => {
    if (!isSuperAdmin) {
      toast.error("Only super admins can update user roles");
      return;
    }

    const nextRole = pendingRoles[user.id];
    if (!nextRole || nextRole === user.role) {
      return;
    }

    try {
      setSavingRoleUserId(user.id);
      await api.patch(`/users/${user.id}/role`, { role: nextRole });
      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id ? { ...item, role: nextRole } : item,
        ),
      );
      setPendingRoles((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
      toast.success(
        "Role updated",
        `${user.first_name} ${user.last_name} is now ${nextRole}`,
      );
    } catch (error: any) {
      toast.error(
        "Failed to update role",
        error.response?.data?.message || error.message,
      );
    } finally {
      setSavingRoleUserId(null);
    }
  };

  const savePermissions = async (user: ManagedUser) => {
    if (!canWritePermissions) {
      toast.error("You need write access to update permissions");
      return;
    }

    try {
      setSavingPermissionUserId(user.id);
      const levelMap = pendingPermissions[user.id] || {};
      const permissions: PermissionAssignment[] = Object.entries(levelMap).map(
        ([key, accessLevel]) => ({ key, accessLevel }),
      );
      await api.put(`/permissions/users/${user.id}`, { permissions });
      setAssignments((prev) => ({ ...prev, [user.id]: levelMap }));
      toast.success(
        "Permissions updated",
        `${user.first_name} ${user.last_name} read/write permissions have been updated`,
      );
    } catch (error: any) {
      toast.error(
        "Failed to update permissions",
        error.response?.data?.message || error.message,
      );
    } finally {
      setSavingPermissionUserId(null);
    }
  };

  if (accessLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader />
        <div className="rounded-2xl bg-white border border-[var(--gray-200)] p-10 text-center text-[var(--gray-500)] shadow-[var(--shadow-sm)]">
          Checking permission access...
        </div>
      </div>
    );
  }

  if (!canReadPermissions) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <ShieldCheckIcon className="h-16 w-16 mx-auto mb-4 text-[var(--gray-300)]" />
          <h2 className="text-xl font-bold text-[var(--gray-700)]">
            Access Denied
          </h2>
          <p className="mt-2 text-[var(--gray-500)]">
            You do not have permission to view function permissions.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader />
        <div className="rounded-2xl bg-white border border-[var(--gray-200)] p-10 text-center text-[var(--gray-500)] shadow-[var(--shadow-sm)]">
          Loading permission data...
        </div>
      </div>
    );
  }

  if (visibleUsers.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader />
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-white border border-[var(--gray-200)] shadow-[var(--shadow-sm)]">
          <UserGroupIcon className="h-12 w-12 text-[var(--gray-300)] mb-4" />
          <p className="text-sm font-semibold text-[var(--gray-600)]">
            No users available
          </p>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader />
        <div className="rounded-2xl bg-white border border-red-200 p-8 text-center shadow-[var(--shadow-sm)]">
          <p className="text-sm font-semibold text-red-700">
            Failed to load data
          </p>
          <p className="text-sm text-red-600 mt-1">{pageError}</p>
          <button
            onClick={fetchAll}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "var(--primary)", color: "white" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader />

      <div className="space-y-4">
        {visibleUsers.map((user) => {
          const selectedPermissions =
            pendingPermissions[user.id] ?? assignments[user.id] ?? {};
          const roleDirty =
            pendingRoles[user.id] !== undefined &&
            pendingRoles[user.id] !== user.role;

          return (
            <div
              key={user.id}
              className="rounded-2xl bg-white border border-[var(--gray-200)] p-5 space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-[var(--gray-500)]">{user.email}</p>
                </div>

                {isSuperAdmin && (
                  <div className="flex items-center gap-2">
                    <select
                      value={pendingRoles[user.id] ?? user.role}
                      onChange={(event) =>
                        setPendingRoles((prev) => ({
                          ...prev,
                          [user.id]: event.target.value,
                        }))
                      }
                      className="px-3 py-2 rounded-lg border border-[var(--gray-200)] text-sm"
                    >
                      {ROLES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => saveRole(user)}
                      disabled={!roleDirty || savingRoleUserId === user.id}
                      className="px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                      style={{ background: "var(--primary)", color: "white" }}
                    >
                      {savingRoleUserId === user.id ? "Saving..." : "Save Role"}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {catalog.map((permission) => {
                  const selectedLevel = selectedPermissions[permission.key];
                  const readChecked =
                    selectedLevel === "read" || selectedLevel === "write";
                  const writeChecked = selectedLevel === "write";
                  return (
                    <div
                      key={`${user.id}-${permission.key}`}
                      className="flex items-start gap-2 border border-[var(--gray-200)] rounded-lg p-3"
                    >
                      <span>
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {permission.label}
                        </p>
                        <p className="text-xs text-[var(--gray-500)]">
                          {permission.description}
                        </p>
                        <div className="mt-2 flex items-center gap-4">
                          <label
                            htmlFor={`permission-read-${user.id}-${permission.key}`}
                            className="inline-flex items-center gap-1 text-xs text-[var(--gray-600)]"
                          >
                            <input
                              id={`permission-read-${user.id}-${permission.key}`}
                              type="checkbox"
                              checked={readChecked}
                              onChange={(event) =>
                                togglePermission(
                                  user.id,
                                  permission.key,
                                  "read",
                                  event.target.checked,
                                )
                              }
                              aria-label={`Grant read access to ${permission.label}`}
                            />
                            <span>Read</span>
                          </label>
                          <label
                            htmlFor={`permission-write-${user.id}-${permission.key}`}
                            className="inline-flex items-center gap-1 text-xs text-[var(--gray-600)]"
                          >
                            <input
                              id={`permission-write-${user.id}-${permission.key}`}
                              type="checkbox"
                              checked={writeChecked}
                              onChange={(event) =>
                                togglePermission(
                                  user.id,
                                  permission.key,
                                  "write",
                                  event.target.checked,
                                )
                              }
                              aria-label={`Grant write access to ${permission.label}`}
                            />
                            <span>Write</span>
                          </label>
                        </div>
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => savePermissions(user)}
                  disabled={
                    savingPermissionUserId === user.id || !canWritePermissions
                  }
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: "var(--primary)", color: "white" }}
                >
                  {savingPermissionUserId === user.id
                    ? "Saving..."
                    : "Save Permissions"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
