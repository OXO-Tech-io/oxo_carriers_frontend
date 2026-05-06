'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import api from '@/lib/api';
import { UserRole } from '@/types';
import {
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  CheckIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface ManagedUser {
  id: number;
  employee_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
  position?: string;
  hire_date?: string;
  must_change_password?: boolean;
}

const ROLES: { value: string; label: string; color: string; bg: string }[] = [
  { value: UserRole.SUPER_ADMIN,       label: 'Super Admin',       color: '#6D28D9', bg: '#EDE9FE' },
  { value: UserRole.HR_MANAGER,        label: 'HR Manager',        color: '#0369A1', bg: '#E0F2FE' },
  { value: UserRole.HR_EXECUTIVE,      label: 'HR Executive',      color: '#0369A1', bg: '#E0F2FE' },
  { value: UserRole.FINANCE_MANAGER,   label: 'Finance Manager',   color: '#065F46', bg: '#D1FAE5' },
  { value: UserRole.FINANCE_EXECUTIVE, label: 'Finance Executive', color: '#065F46', bg: '#D1FAE5' },
  { value: UserRole.PAYMENT_APPROVER,  label: 'Payment Approver',  color: '#92400E', bg: '#FEF3C7' },
  { value: UserRole.EMPLOYEE,          label: 'Employee',          color: '#1E40AF', bg: '#DBEAFE' },
  { value: UserRole.CONSULTANT,        label: 'Consultant',        color: '#3730A3', bg: '#EEF2FF' },
  { value: UserRole.SERVICE_PROVIDER,  label: 'Service Provider',  color: '#831843', bg: '#FCE7F3' },
];

function roleMeta(role: string) {
  return ROLES.find((r) => r.value === role) ?? { label: role.replace(/_/g, ' '), color: '#475569', bg: '#F1F5F9' };
}

function RoleBadge({ role }: { role: string }) {
  const meta = roleMeta(role);
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ color: meta.color, background: meta.bg }}
    >
      {meta.label}
    </span>
  );
}

export default function PermissionsPage() {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [pendingRole, setPendingRole] = useState<Record<number, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterRole) params.append('role', filterRole);
      const response = await api.get(`/users?${params.toString()}`);
      setUsers(response.data.users || []);
    } catch (err: any) {
      toast.error('Failed to load users', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterRole, toast]);

  useEffect(() => {
    if (isSuperAdmin) fetchUsers();
  }, [isSuperAdmin, fetchUsers]);

  const handleRoleChange = (userId: number, newRole: string) => {
    setPendingRole((prev) => ({ ...prev, [userId]: newRole }));
  };

  const handleSaveRole = async (user: ManagedUser) => {
    const newRole = pendingRole[user.id];
    if (!newRole || newRole === user.role) return;

    setSaving(user.id);
    try {
      await api.patch(`/users/${user.id}/role`, { role: newRole });
      toast.success(
        'Role updated',
        `${user.first_name} ${user.last_name} is now ${roleMeta(newRole).label}`
      );
      // update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      setPendingRole((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
    } catch (err: any) {
      toast.error(
        'Failed to update role',
        err.response?.data?.message || err.message
      );
    } finally {
      setSaving(null);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <ShieldCheckIcon className="h-16 w-16 mx-auto mb-4 text-[var(--gray-300)]" />
          <h2 className="text-xl font-bold text-[var(--gray-700)]">Access Denied</h2>
          <p className="mt-2 text-[var(--gray-500)]">
            Only Super Admins can manage user permissions.
          </p>
        </div>
      </div>
    );
  }

  const displayedUsers = users.filter((u) => u.id !== currentUser?.id);
  const pendingCount = Object.keys(pendingRole).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'var(--primary)' }}
            >
              <ShieldCheckIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                Permission Management
              </h1>
              <p className="text-sm text-[var(--gray-500)]">
                Assign and manage user roles across the system
              </p>
            </div>
          </div>
        </div>

        {pendingCount > 0 && (
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
            style={{ background: '#EEF2FF', color: '#4338CA' }}
          >
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            {pendingCount} unsaved change{pendingCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* ── Role legend ── */}
      <div className="rounded-2xl bg-white border border-[var(--gray-200)] p-5 shadow-[var(--shadow-sm)]">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--gray-400)] mb-3">
          Role reference
        </p>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <span
              key={r.value}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ color: r.color, background: r.bg }}
            >
              {r.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="rounded-2xl bg-white border border-[var(--gray-200)] p-4 shadow-[var(--shadow-sm)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gray-400)]" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-[var(--gray-200)] bg-[var(--gray-50)] text-[var(--foreground)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:border-transparent transition-all"
              style={{ '--tw-ring-color': 'var(--primary-ring)' } as any}
            />
          </div>
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gray-400)]" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-[var(--gray-200)] bg-[var(--gray-50)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:border-transparent transition-all appearance-none"
            >
              <option value="">All Roles</option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="rounded-2xl bg-white border border-[var(--gray-200)] overflow-hidden shadow-[var(--shadow-sm)]">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-6 py-4 border-b border-[var(--gray-100)] last:border-0"
            >
              <div className="h-10 w-10 rounded-xl bg-[var(--gray-100)] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 rounded bg-[var(--gray-100)] animate-pulse" />
                <div className="h-3 w-1/4 rounded bg-[var(--gray-100)] animate-pulse" />
              </div>
              <div className="h-9 w-44 rounded-xl bg-[var(--gray-100)] animate-pulse" />
              <div className="h-9 w-20 rounded-xl bg-[var(--gray-100)] animate-pulse" />
            </div>
          ))}
        </div>
      ) : displayedUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-white border border-[var(--gray-200)] shadow-[var(--shadow-sm)]">
          <UserGroupIcon className="h-12 w-12 text-[var(--gray-300)] mb-4" />
          <p className="text-sm font-semibold text-[var(--gray-600)]">No users found</p>
          <p className="text-xs text-[var(--gray-400)] mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-[var(--gray-200)] overflow-hidden shadow-[var(--shadow-sm)]">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_auto_220px_100px] gap-4 px-6 py-3 bg-[var(--gray-50)] border-b border-[var(--gray-200)]">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--gray-500)]">User</p>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--gray-500)]">Current Role</p>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--gray-500)]">Assign Role</p>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--gray-500)]">Action</p>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[var(--gray-100)]">
            {displayedUsers.map((u) => {
              const hasPending = pendingRole[u.id] !== undefined && pendingRole[u.id] !== u.role;
              const isSavingThis = saving === u.id;
              const selectedRole = pendingRole[u.id] ?? u.role;

              return (
                <div
                  key={u.id}
                  className={`flex flex-col sm:grid sm:grid-cols-[1fr_auto_220px_100px] sm:items-center gap-4 px-6 py-4 transition-colors duration-150 ${
                    hasPending ? 'bg-indigo-50/60' : 'hover:bg-[var(--gray-50)]'
                  }`}
                >
                  {/* User info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                      style={{ background: 'var(--primary)' }}
                    >
                      {u.first_name[0]}{u.last_name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                        {u.first_name} {u.last_name}
                      </p>
                      <p className="text-xs text-[var(--gray-500)] truncate">{u.email}</p>
                      {u.department && (
                        <p className="text-xs text-[var(--gray-400)] truncate">{u.department}</p>
                      )}
                    </div>
                  </div>

                  {/* Current role badge */}
                  <div className="flex sm:justify-start">
                    <RoleBadge role={u.role} />
                  </div>

                  {/* Role selector */}
                  <select
                    value={selectedRole}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={isSavingThis}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--gray-200)] bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      borderColor: hasPending ? 'var(--primary)' : undefined,
                      boxShadow: hasPending ? '0 0 0 3px var(--primary-ring)' : undefined,
                    }}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>

                  {/* Save button */}
                  <button
                    onClick={() => handleSaveRole(u)}
                    disabled={!hasPending || isSavingThis}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={
                      hasPending && !isSavingThis
                        ? {
                            background: 'var(--primary)',
                            color: 'white',
                            boxShadow: 'var(--shadow-indigo)',
                          }
                        : {
                            background: 'var(--gray-100)',
                            color: 'var(--gray-400)',
                          }
                    }
                  >
                    {isSavingThis ? (
                      <svg
                        className="animate-spin h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <CheckIcon className="h-4 w-4" />
                    )}
                    {isSavingThis ? 'Saving' : 'Apply'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-[var(--gray-50)] border-t border-[var(--gray-200)] flex items-center justify-between">
            <p className="text-xs text-[var(--gray-400)]">
              {displayedUsers.length} user{displayedUsers.length !== 1 ? 's' : ''} listed
            </p>
            {pendingCount > 0 && (
              <p className="text-xs font-medium text-indigo-600">
                {pendingCount} pending change{pendingCount > 1 ? 's' : ''} — click Apply to save
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
