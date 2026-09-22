'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeUserId: number | null;
  /** HR Manager / HR Executive / Administrator - can edit the organizational
   * fields below. Everyone else who can open this modal only gets read-only
   * profile visibility (OCD-476). */
  canEdit: boolean;
  onSaved?: () => void;
}

// Raw shape returned by GET /users/:employeeUserId (EmployeeModel.findById,
// decrypted) - camelCase, not run through the shared User mapper since this
// modal only needs a handful of fields and wants to stay decoupled from the
// wizard/self-service profile types.
interface EmployeeDetail {
  id: number;
  employeeId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status?: string | null;
  department?: string | null;
  position?: string | null;
  workLocation?: 'office' | 'remote' | 'hybrid' | null;
  employeeCategory?: 'internal' | 'client_side' | null;
  hireDate?: string | null;
}

const WORK_LOCATION_OPTIONS: { value: 'office' | 'remote' | 'hybrid'; label: string }[] = [
  { value: 'office', label: 'Office' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

const EMPLOYEE_CATEGORY_OPTIONS: { value: 'internal' | 'client_side'; label: string }[] = [
  { value: 'internal', label: 'Internal' },
  { value: 'client_side', label: 'Client Side' },
];

export default function EditEmployeeModal({
  isOpen,
  onClose,
  employeeUserId,
  canEdit,
  onSaved,
}: EditEmployeeModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    department: '',
    position: '',
    work_location: '' as '' | 'office' | 'remote' | 'hybrid',
    employee_category: '' as '' | 'internal' | 'client_side',
    hire_date: '',
  });

  useEffect(() => {
    if (!isOpen || !employeeUserId) return;

    let cancelled = false;
    // Kicking off a fetch when the modal opens/employee changes is exactly
    // what this effect is for; loading must flip back to true on a re-open.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    api
      .get(`/users/${employeeUserId}`)
      .then((res) => {
        if (cancelled) return;
        const user: EmployeeDetail = res.data.user;
        setEmployee(user);
        setForm({
          first_name: user.firstName || '',
          last_name: user.lastName || '',
          email: user.email || '',
          department: user.department || '',
          position: user.position || '',
          work_location: user.workLocation || '',
          employee_category: user.employeeCategory || '',
          hire_date: user.hireDate ? user.hireDate.slice(0, 10) : '',
        });
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load', 'Could not fetch employee details');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, employeeUserId]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!employeeUserId) return;
    setSaving(true);
    try {
      await api.put(`/users/${employeeUserId}`, {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        department: form.department,
        position: form.position,
        work_location: form.work_location || undefined,
        employee_category: form.employee_category || undefined,
        hire_date: form.hire_date || undefined,
      });
      toast.success('Employee updated', 'Profile changes have been saved.');
      onSaved?.();
      onClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error('Failed to save', message || 'Please check the form and try again');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
        <div
          className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white px-6 pt-6 pb-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-[#101828]">
                {canEdit ? 'Edit Employee' : 'Employee Details'}
              </h3>
              <button onClick={onClose} className="text-[#98A2B3] hover:text-[#344054] transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#465FFF] border-t-transparent"></div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Employee ID">
                    <p className="text-sm font-semibold text-[#101828] px-3.5 py-2.5 bg-[#F9FAFB] rounded-lg border border-[#E4E7EC]">
                      {employee?.employeeId || 'N/A'}
                    </p>
                  </Field>
                  <Field label="Role">
                    <p className="text-sm font-semibold text-[#101828] px-3.5 py-2.5 bg-[#F9FAFB] rounded-lg border border-[#E4E7EC] capitalize">
                      {employee?.role?.replace(/_/g, ' ') || 'N/A'}
                    </p>
                  </Field>

                  <Field label="First Name">
                    {canEdit ? (
                      <input
                        type="text"
                        value={form.first_name}
                        onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                        className="w-full px-3.5 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                      />
                    ) : (
                      <ReadOnly value={employee?.firstName} />
                    )}
                  </Field>
                  <Field label="Last Name">
                    {canEdit ? (
                      <input
                        type="text"
                        value={form.last_name}
                        onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                        className="w-full px-3.5 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                      />
                    ) : (
                      <ReadOnly value={employee?.lastName} />
                    )}
                  </Field>

                  <Field label="Account Email" className="sm:col-span-2">
                    {canEdit ? (
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full px-3.5 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                      />
                    ) : (
                      <ReadOnly value={employee?.email} />
                    )}
                  </Field>

                  <Field label="Department">
                    {canEdit ? (
                      <input
                        type="text"
                        value={form.department}
                        onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                        className="w-full px-3.5 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                      />
                    ) : (
                      <ReadOnly value={employee?.department} />
                    )}
                  </Field>
                  <Field label="Position">
                    {canEdit ? (
                      <input
                        type="text"
                        value={form.position}
                        onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                        className="w-full px-3.5 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                      />
                    ) : (
                      <ReadOnly value={employee?.position} />
                    )}
                  </Field>

                  <Field label="Work Location">
                    {canEdit ? (
                      <select
                        value={form.work_location}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            work_location: e.target.value as '' | 'office' | 'remote' | 'hybrid',
                          }))
                        }
                        className="w-full px-3.5 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] bg-white focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                      >
                        <option value="">Not set</option>
                        {WORK_LOCATION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <ReadOnly
                        value={WORK_LOCATION_OPTIONS.find((o) => o.value === employee?.workLocation)?.label}
                      />
                    )}
                  </Field>
                  <Field label="Employee Type">
                    {canEdit ? (
                      <select
                        value={form.employee_category}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            employee_category: e.target.value as '' | 'internal' | 'client_side',
                          }))
                        }
                        className="w-full px-3.5 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] bg-white focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                      >
                        <option value="">Not set</option>
                        {EMPLOYEE_CATEGORY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <ReadOnly
                        value={EMPLOYEE_CATEGORY_OPTIONS.find((o) => o.value === employee?.employeeCategory)?.label}
                      />
                    )}
                  </Field>

                  <Field label="Hire Date">
                    {canEdit ? (
                      <input
                        type="date"
                        value={form.hire_date}
                        onChange={(e) => setForm((f) => ({ ...f, hire_date: e.target.value }))}
                        className="w-full px-3.5 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                      />
                    ) : (
                      <ReadOnly value={employee?.hireDate ? employee.hireDate.slice(0, 10) : undefined} />
                    )}
                  </Field>
                  <Field label="Account Status">
                    <p className="text-sm font-semibold text-[#101828] px-3.5 py-2.5 bg-[#F9FAFB] rounded-lg border border-[#E4E7EC] capitalize">
                      {employee?.status?.replace(/_/g, ' ') || 'Active'}
                    </p>
                  </Field>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-sm font-semibold text-[#344054] bg-white border border-[#D0D5DD] rounded-lg hover:bg-[#F9FAFB] transition-colors"
                  >
                    {canEdit ? 'Cancel' : 'Close'}
                  </button>
                  {canEdit && (
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2.5 text-sm font-semibold text-white bg-[#465FFF] rounded-lg hover:bg-[#3641F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-[#344054] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ReadOnly({ value }: { value?: string | null }) {
  return (
    <p className="text-sm font-semibold text-[#101828] px-3.5 py-2.5 bg-[#F9FAFB] rounded-lg border border-[#E4E7EC]">
      {value || '—'}
    </p>
  );
}
