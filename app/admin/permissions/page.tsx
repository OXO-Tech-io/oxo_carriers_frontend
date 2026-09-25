"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";
import api from "@/lib/api";
import { UserRole } from "@/types";
import { Card, CardHeader, Button, Badge, EmptyState } from "@/components/ui";
import {
  ShieldCheck,
  Search,
  Users as UsersIcon,
  Info,
  AlertTriangle,
} from "lucide-react";

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

// Super Admin bypasses the permission table entirely (see PermissionGuard),
// so it has no configurable default template - excluded from the Role
// Defaults tab specifically (it still appears in the per-user role <select>
// above, since a user's actual role can be Super Admin).
const ROLE_DEFAULT_ROLES = ROLES.filter((role) => role.value !== UserRole.SUPER_ADMIN);

const ROLE_LABEL_BY_VALUE: Record<string, string> = Object.fromEntries(
  ROLES.map((role) => [role.value, role.label]),
);

// Nicer section headings than the raw PERMISSION_CATALOG `group` keys.
const GROUP_LABELS: Record<string, string> = {
  core: "Core",
  users: "User Management",
  permissions: "Permissions",
  vouchers: "Vouchers",
  leaves: "Leaves",
  salaries: "Salaries",
  facilities: "Facilities",
  claims: "Medical Claims",
  consultants: "Consultant Submissions",
  vendors: "Vendors",
  reports: "Reports",
  profile: "Profile Changes",
  employee_notes: "Employee Notes",
  communications: "Communications",
  events: "Events",
  forms: "Forms",
  work_logs: "Work Logs",
  groups: "Groups",
  notices: "Notice Board",
  attendance: "Attendance",
  documents: "Document Vault",
  archive: "Archive",
};

type PageTab = "users" | "roles";

function groupCatalog(catalog: PermissionItem[]) {
  const order: string[] = [];
  const byGroup: Record<string, PermissionItem[]> = {};
  for (const item of catalog) {
    if (!byGroup[item.group]) {
      byGroup[item.group] = [];
      order.push(item.group);
    }
    byGroup[item.group].push(item);
  }
  return order.map((group) => ({
    group,
    label: GROUP_LABELS[group] ?? group,
    items: byGroup[group],
  }));
}

function grantedCount(levelMap: PermissionLevelMap | undefined) {
  return Object.keys(levelMap ?? {}).length;
}

function isDirty(pending: PermissionLevelMap | undefined, saved: PermissionLevelMap | undefined) {
  const p = pending ?? {};
  const s = saved ?? {};
  const pKeys = Object.keys(p);
  const sKeys = Object.keys(s);
  if (pKeys.length !== sKeys.length) return true;
  return pKeys.some((key) => p[key] !== s[key]);
}

const ACCESS_OPTIONS: { level: AccessLevel | undefined; label: string }[] = [
  { level: undefined, label: "None" },
  { level: "read", label: "Read" },
  { level: "write", label: "Write" },
];

function AccessLevelControl({
  value,
  onChange,
  disabled,
  permissionLabel,
}: {
  value?: AccessLevel;
  onChange: (level: AccessLevel | undefined) => void;
  disabled?: boolean;
  permissionLabel: string;
}) {
  return (
    <div className="inline-flex shrink-0 rounded-lg bg-[var(--gray-50)] p-0.5" role="group" aria-label={permissionLabel}>
      {ACCESS_OPTIONS.map((opt) => {
        const active = value === opt.level;
        const activeClass =
          opt.level === "write"
            ? "bg-[var(--success)] text-white"
            : opt.level === "read"
              ? "bg-[var(--info)] text-white"
              : "bg-[var(--card-bg)] text-[var(--gray-500)] shadow-sm";
        return (
          <button
            key={opt.label}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.level)}
            aria-pressed={active}
            aria-label={`${permissionLabel} — ${opt.label}`}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
              active ? activeClass : "text-[var(--gray-400)] hover:text-[var(--foreground)]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function PermissionGroupList({
  groups,
  selected,
  onChange,
  disabled,
}: {
  groups: ReturnType<typeof groupCatalog>;
  selected: PermissionLevelMap;
  onChange: (key: string, level: AccessLevel | undefined) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-5">
      {groups.map((section) => (
        <div key={section.group}>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--gray-400)]">
            {section.label}
          </p>
          <div className="divide-y divide-[var(--gray-100)] rounded-xl border border-[var(--gray-100)] overflow-hidden">
            {section.items.map((permission) => (
              <div
                key={permission.key}
                className="flex items-center justify-between gap-4 px-4 py-3 bg-[var(--card-bg)] odd:bg-[var(--gray-25)]"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                    {permission.label}
                  </p>
                  <p className="text-xs text-[var(--gray-400)] truncate">{permission.description}</p>
                </div>
                <AccessLevelControl
                  value={selected[permission.key]}
                  onChange={(level) => onChange(permission.key, level)}
                  disabled={disabled}
                  permissionLabel={permission.label}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ListPanel({ children }: { children: ReactNode }) {
  return (
    <Card padding="sm" className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-8rem)] flex flex-col">
      {children}
    </Card>
  );
}

export default function PermissionsPage() {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const toast = useToast();

  const [pageTab, setPageTab] = useState<PageTab>("users");
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [catalog, setCatalog] = useState<PermissionItem[]>([]);
  const [assignments, setAssignments] = useState<Record<number, PermissionLevelMap>>({});
  const [pendingRoles, setPendingRoles] = useState<Record<number, string>>({});
  const [pendingPermissions, setPendingPermissions] = useState<Record<number, PermissionLevelMap>>({});
  const [roleDefaults, setRoleDefaults] = useState<Record<string, PermissionLevelMap>>({});
  const [pendingRoleDefaults, setPendingRoleDefaults] = useState<Record<string, PermissionLevelMap>>({});
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [accessLoading, setAccessLoading] = useState(true);
  const [permissionsAccessLevel, setPermissionsAccessLevel] = useState<AccessLevel | null>(null);
  const [savingRoleUserId, setSavingRoleUserId] = useState<number | null>(null);
  const [savingPermissionUserId, setSavingPermissionUserId] = useState<number | null>(null);
  const [savingRoleDefaultsFor, setSavingRoleDefaultsFor] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>(ROLE_DEFAULT_ROLES[0]?.value ?? "");

  const canReadPermissions =
    isSuperAdmin || permissionsAccessLevel === "read" || permissionsAccessLevel === "write";
  const canWritePermissions = isSuperAdmin || permissionsAccessLevel === "write";

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

  const normalizeRoleDefaults = (
    raw: Array<{ role: string; assignments?: PermissionAssignment[] }>,
  ) => {
    const normalized: Record<string, PermissionLevelMap> = {};
    (raw || []).forEach((entry) => {
      if (!entry?.role) return;
      const levels: PermissionLevelMap = {};
      (entry.assignments || []).forEach((item) => {
        if (
          item &&
          typeof item.key === "string" &&
          (item.accessLevel === "read" || item.accessLevel === "write")
        ) {
          levels[item.key] = item.accessLevel;
        }
      });
      normalized[entry.role] = levels;
    });
    return normalized;
  };

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");
      const [usersRes, catalogRes, assignmentsRes, roleDefaultsRes] = await Promise.all([
        api.get("/permissions/manageable-users"),
        api.get("/permissions/catalog"),
        api.get("/permissions/users"),
        api.get("/permissions/roles"),
      ]);

      setUsers(usersRes.data?.users || []);
      setCatalog(catalogRes.data?.permissions || []);
      const normalizedAssignments = normalizeAssignments(assignmentsRes.data?.assignments || {});
      setAssignments(normalizedAssignments);
      setPendingPermissions(normalizedAssignments);

      const normalizedRoleDefaults = normalizeRoleDefaults(roleDefaultsRes.data?.roles || []);
      setRoleDefaults(normalizedRoleDefaults);
      setPendingRoleDefaults(normalizedRoleDefaults);
    } catch (error: any) {
      setPageError(error.response?.data?.message || error.message);
      toast.error("Failed to load permission data", error.response?.data?.message || error.message);
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

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    if (!term) return visibleUsers;
    return visibleUsers.filter((user) =>
      `${user.first_name} ${user.last_name} ${user.email}`.toLowerCase().includes(term),
    );
  }, [visibleUsers, userSearch]);

  // Pick a sensible default selection once the user list has loaded, without
  // fighting a selection the admin already made (e.g. by typing a search).
  useEffect(() => {
    if (selectedUserId === null && visibleUsers.length > 0) {
      setSelectedUserId(visibleUsers[0].id);
    }
  }, [visibleUsers, selectedUserId]);

  const selectedUser = useMemo(
    () => visibleUsers.find((user) => user.id === selectedUserId) ?? null,
    [visibleUsers, selectedUserId],
  );

  const catalogGroups = useMemo(() => groupCatalog(catalog), [catalog]);

  const togglePermission = (userId: number, permissionKey: string, level: AccessLevel | undefined) => {
    setPendingPermissions((prev) => {
      const next = { ...(prev[userId] || {}) };
      if (level) {
        next[permissionKey] = level;
      } else {
        delete next[permissionKey];
      }
      return { ...prev, [userId]: next };
    });
  };

  const toggleRoleDefaultPermission = (role: string, permissionKey: string, level: AccessLevel | undefined) => {
    setPendingRoleDefaults((prev) => {
      const next = { ...(prev[role] || {}) };
      if (level) {
        next[permissionKey] = level;
      } else {
        delete next[permissionKey];
      }
      return { ...prev, [role]: next };
    });
  };

  const discardPermissionChanges = (userId: number) => {
    setPendingPermissions((prev) => ({ ...prev, [userId]: assignments[userId] ?? {} }));
  };

  const discardRoleDefaultChanges = (role: string) => {
    setPendingRoleDefaults((prev) => ({ ...prev, [role]: roleDefaults[role] ?? {} }));
  };

  const saveRoleDefaults = async (role: string) => {
    if (!canWritePermissions) {
      toast.error("You need write access to update role defaults");
      return;
    }

    try {
      setSavingRoleDefaultsFor(role);
      const levelMap = pendingRoleDefaults[role] || {};
      const permissions: PermissionAssignment[] = Object.entries(levelMap).map(([key, accessLevel]) => ({
        key,
        accessLevel,
      }));
      await api.put(`/permissions/roles/${role}`, { permissions });
      setRoleDefaults((prev) => ({ ...prev, [role]: levelMap }));
      toast.success(
        "Role defaults updated",
        "New users assigned to this role (and future role changes) will get these defaults. Existing users with this role are unaffected.",
      );
    } catch (error: any) {
      toast.error("Failed to update role defaults", error.response?.data?.message || error.message);
    } finally {
      setSavingRoleDefaultsFor(null);
    }
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
      setUsers((prev) => prev.map((item) => (item.id === user.id ? { ...item, role: nextRole } : item)));
      setPendingRoles((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
      toast.success("Role updated", `${user.first_name} ${user.last_name} is now ${nextRole}`);
    } catch (error: any) {
      toast.error("Failed to update role", error.response?.data?.message || error.message);
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
      const permissions: PermissionAssignment[] = Object.entries(levelMap).map(([key, accessLevel]) => ({
        key,
        accessLevel,
      }));
      await api.put(`/permissions/users/${user.id}`, { permissions });
      setAssignments((prev) => ({ ...prev, [user.id]: levelMap }));
      toast.success(
        "Permissions updated",
        `${user.first_name} ${user.last_name} read/write permissions have been updated`,
      );
    } catch (error: any) {
      toast.error("Failed to update permissions", error.response?.data?.message || error.message);
    } finally {
      setSavingPermissionUserId(null);
    }
  };

  if (accessLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader />
        <Card padding="lg" className="text-center text-[var(--gray-400)]">
          Checking permission access...
        </Card>
      </div>
    );
  }

  if (!canReadPermissions) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={ShieldCheck}
          title="Access Denied"
          description="You do not have permission to view function permissions."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader />
        <TabSwitcher pageTab={pageTab} onChange={setPageTab} />
        <Card padding="lg" className="text-center text-[var(--gray-400)]">
          Loading permission data...
        </Card>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader />
        <Card padding="lg" className="text-center">
          <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-red-500" />
          <p className="text-sm font-bold text-red-600 dark:text-red-400">Failed to load data</p>
          <p className="text-sm text-[var(--gray-400)] mt-1">{pageError}</p>
          <Button variant="primary" size="sm" className="mt-4" onClick={fetchAll}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <PageHeader />
      <TabSwitcher pageTab={pageTab} onChange={setPageTab} />

      {pageTab === "users" && (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
          <ListPanel>
            <div className="relative mb-3 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gray-400)]" />
              <input
                type="text"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search users..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] text-sm text-[var(--foreground)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-ring)]"
              />
            </div>
            {filteredUsers.length === 0 ? (
              <p className="text-xs text-[var(--gray-400)] text-center py-6">No users match your search.</p>
            ) : (
              <div className="space-y-0.5 overflow-y-auto" data-testid="user-list">
                {filteredUsers.map((user) => {
                  const count = grantedCount(pendingPermissions[user.id] ?? assignments[user.id]);
                  const active = user.id === selectedUserId;
                  return (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                        active ? "bg-[var(--primary-light)]" : "hover:bg-[var(--gray-50)]"
                      }`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white bg-[var(--primary)]">
                        {user.first_name?.[0]}
                        {user.last_name?.[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-semibold truncate ${
                            active ? "text-[var(--primary)]" : "text-[var(--foreground)]"
                          }`}
                        >
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-[var(--gray-400)] truncate">{user.email}</p>
                      </div>
                      <span className="text-[10px] font-bold text-[var(--gray-400)] shrink-0">
                        {count}/{catalog.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </ListPanel>

          {!selectedUser ? (
            <Card>
              <EmptyState icon={UsersIcon} title="Select a user" description="Pick a user from the list to manage their permissions." />
            </Card>
          ) : (
            <div data-testid="detail-panel">
            <UserDetailPanel
              key={selectedUser.id}
              user={selectedUser}
              isSuperAdmin={isSuperAdmin}
              catalogGroups={catalogGroups}
              selectedPermissions={pendingPermissions[selectedUser.id] ?? assignments[selectedUser.id] ?? {}}
              savedPermissions={assignments[selectedUser.id] ?? {}}
              pendingRole={pendingRoles[selectedUser.id]}
              onRoleChange={(role) => setPendingRoles((prev) => ({ ...prev, [selectedUser.id]: role }))}
              onSaveRole={() => saveRole(selectedUser)}
              savingRole={savingRoleUserId === selectedUser.id}
              onTogglePermission={(key, level) => togglePermission(selectedUser.id, key, level)}
              onSavePermissions={() => savePermissions(selectedUser)}
              onDiscard={() => discardPermissionChanges(selectedUser.id)}
              savingPermissions={savingPermissionUserId === selectedUser.id}
              canWritePermissions={canWritePermissions}
            />
            </div>
          )}
        </div>
      )}

      {pageTab === "roles" && (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
          <ListPanel>
            <div className="space-y-0.5 overflow-y-auto" data-testid="role-list">
              {ROLE_DEFAULT_ROLES.map((role) => {
                const count = grantedCount(pendingRoleDefaults[role.value] ?? roleDefaults[role.value]);
                const active = role.value === selectedRole;
                return (
                  <button
                    key={role.value}
                    onClick={() => setSelectedRole(role.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                      active ? "bg-[var(--primary-light)]" : "hover:bg-[var(--gray-50)]"
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--purple-light)] text-[var(--purple-text)]">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <span
                      className={`flex-1 text-sm font-semibold truncate ${
                        active ? "text-[var(--primary)]" : "text-[var(--foreground)]"
                      }`}
                    >
                      {role.label}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--gray-400)] shrink-0">
                      {count}/{catalog.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </ListPanel>

          <div data-testid="detail-panel">
          <RoleDetailPanel
            key={selectedRole}
            role={selectedRole}
            catalogGroups={catalogGroups}
            selectedPermissions={pendingRoleDefaults[selectedRole] ?? roleDefaults[selectedRole] ?? {}}
            onTogglePermission={(key, level) => toggleRoleDefaultPermission(selectedRole, key, level)}
            onSave={() => saveRoleDefaults(selectedRole)}
            onDiscard={() => discardRoleDefaultChanges(selectedRole)}
            saving={savingRoleDefaultsFor === selectedRole}
            dirty={isDirty(pendingRoleDefaults[selectedRole], roleDefaults[selectedRole])}
            canWritePermissions={canWritePermissions}
          />
          </div>
        </div>
      )}
    </div>
  );
}

function PageHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]">
        <ShieldCheck className="h-5 w-5 text-white" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Function Permission Management</h1>
        <p className="text-sm text-[var(--gray-400)]">
          Assign feature-level permissions. Role and permissions are saved separately.
        </p>
      </div>
    </div>
  );
}

function TabSwitcher({ pageTab, onChange }: { pageTab: PageTab; onChange: (tab: PageTab) => void }) {
  const tabs: { value: PageTab; label: string }[] = [
    { value: "users", label: "Per-User Permissions" },
    { value: "roles", label: "Role Defaults" },
  ];
  return (
    <div className="inline-flex rounded-xl bg-[var(--gray-100)] p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
            pageTab === tab.value
              ? "bg-[var(--card-bg)] text-[var(--primary)] shadow-sm"
              : "text-[var(--gray-500)] hover:text-[var(--foreground)]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function UserDetailPanel({
  user,
  isSuperAdmin,
  catalogGroups,
  selectedPermissions,
  savedPermissions,
  pendingRole,
  onRoleChange,
  onSaveRole,
  savingRole,
  onTogglePermission,
  onSavePermissions,
  onDiscard,
  savingPermissions,
  canWritePermissions,
}: {
  user: ManagedUser;
  isSuperAdmin: boolean;
  catalogGroups: ReturnType<typeof groupCatalog>;
  selectedPermissions: PermissionLevelMap;
  savedPermissions: PermissionLevelMap;
  pendingRole: string | undefined;
  onRoleChange: (role: string) => void;
  onSaveRole: () => void;
  savingRole: boolean;
  onTogglePermission: (key: string, level: AccessLevel | undefined) => void;
  onSavePermissions: () => void;
  onDiscard: () => void;
  savingPermissions: boolean;
  canWritePermissions: boolean;
}) {
  const roleDirty = pendingRole !== undefined && pendingRole !== user.role;
  const permissionsDirty = isDirty(selectedPermissions, savedPermissions);

  return (
    <Card padding="sm">
      <CardHeader
        title={`${user.first_name} ${user.last_name}`}
        subtitle={user.email}
        action={
          <Badge variant="gray">{ROLE_LABEL_BY_VALUE[user.role] ?? user.role}</Badge>
        }
      />

      {isSuperAdmin && (
        <div className="flex flex-wrap items-center gap-2 mb-5 pb-5 border-b border-[var(--gray-100)]">
          <label className="text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Role</label>
          <select
            value={pendingRole ?? user.role}
            onChange={(event) => onRoleChange(event.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] text-sm text-[var(--foreground)]"
          >
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={onSaveRole} disabled={!roleDirty} isLoading={savingRole}>
            Save Role
          </Button>
          {roleDirty && (
            <span className="text-xs font-medium text-[var(--warning-text)]">
              Changing the role fully replaces this user&apos;s permissions with the new role&apos;s defaults.
            </span>
          )}
        </div>
      )}

      <PermissionGroupList
        groups={catalogGroups}
        selected={selectedPermissions}
        onChange={onTogglePermission}
        disabled={!canWritePermissions}
      />

      <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-[var(--gray-100)]">
        {permissionsDirty && (
          <span className="text-xs font-semibold text-[var(--warning-text)] mr-auto">Unsaved changes</span>
        )}
        <Button variant="outline" size="sm" onClick={onDiscard} disabled={!permissionsDirty}>
          Discard
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onSavePermissions}
          disabled={!canWritePermissions || !permissionsDirty}
          isLoading={savingPermissions}
        >
          Save Permissions
        </Button>
      </div>
    </Card>
  );
}

function RoleDetailPanel({
  role,
  catalogGroups,
  selectedPermissions,
  onTogglePermission,
  onSave,
  onDiscard,
  saving,
  dirty,
  canWritePermissions,
}: {
  role: string;
  catalogGroups: ReturnType<typeof groupCatalog>;
  selectedPermissions: PermissionLevelMap;
  onTogglePermission: (key: string, level: AccessLevel | undefined) => void;
  onSave: () => void;
  onDiscard: () => void;
  saving: boolean;
  dirty: boolean;
  canWritePermissions: boolean;
}) {
  return (
    <Card padding="sm">
      <CardHeader title={ROLE_LABEL_BY_VALUE[role] ?? role} />

      <div className="flex items-start gap-2 mb-5 p-3 rounded-xl bg-[var(--info-light)] text-[var(--info-text)] text-xs font-medium">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          These are the permissions granted automatically to a newly created user assigned this role, and
          re-applied in full whenever an existing user&apos;s role is changed. Editing a role&apos;s defaults
          here does not affect any already-created user - use the Per-User Permissions tab for that.
        </p>
      </div>

      <PermissionGroupList
        groups={catalogGroups}
        selected={selectedPermissions}
        onChange={onTogglePermission}
        disabled={!canWritePermissions}
      />

      <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-[var(--gray-100)]">
        {dirty && <span className="text-xs font-semibold text-[var(--warning-text)] mr-auto">Unsaved changes</span>}
        <Button variant="outline" size="sm" onClick={onDiscard} disabled={!dirty}>
          Discard
        </Button>
        <Button variant="primary" size="sm" onClick={onSave} disabled={!canWritePermissions || !dirty} isLoading={saving}>
          Save Role Defaults
        </Button>
      </div>
    </Card>
  );
}
