'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type FieldPath } from 'react-hook-form';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { toIsoDay } from '@/lib/leaveConflicts';
import { EMAIL_PATTERN, noEmoji, OFFICE_EMAIL_DOMAIN } from '@/lib/validation/textValidation';
import { useSubmitProfileChangeMutation } from '@/hooks/mutations/use-submit-profile-change-mutation';
import { stashPendingBasicChanges } from '@/components/profile/wizard/wizardDiff';
import { Field, inputClass, selectClass } from '@/components/modals/employee-wizard/shared';
import {
  CAREER_PATH_OPTIONS,
  TITLE_OPTIONS,
  careerPathLabel,
  type BasicUserField,
  type CareerPath,
  type ProfileChangeItem,
} from '@/types/profile';
import type { UserTitle } from '@/types';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeUserId: number | null;
  /** HR Manager / HR Executive / Administrator - can edit the organizational
   * fields below. Everyone else who can open this modal only gets read-only
   * profile visibility (OCD-476). */
  canEdit: boolean;
  /** HR Manager / HR Executive only (OCD-603/604): opens the full Edit Profile
   * wizard for this employee; the changes go through approval. Also means that
   * Save Changes here is submitted for approval instead of applied directly
   * (OCD-650). */
  canEditFullProfile?: boolean;
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
  title?: UserTitle | null;
  firstName: string;
  lastName: string;
  role: string;
  status?: string | null;
  department?: string | null;
  position?: string | null;
  careerPath?: string | null;
  workLocation?: 'office' | 'remote' | 'hybrid' | null;
  employeeCategory?: 'internal' | 'client_side' | null;
  hireDate?: string | null;
  deviceId?: string | null;
}

interface EditEmployeeForm {
  title: '' | UserTitle;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  position: string;
  career_path: '' | CareerPath;
  work_location: '' | 'office' | 'remote' | 'hybrid';
  employee_category: '' | 'internal' | 'client_side';
  hire_date: string;
  device_id: string;
}

const EMPTY_FORM: EditEmployeeForm = {
  title: '',
  first_name: '',
  last_name: '',
  email: '',
  department: '',
  position: '',
  career_path: '',
  work_location: '',
  employee_category: '',
  hire_date: '',
  device_id: '',
};

const WORK_LOCATION_OPTIONS: { value: 'office' | 'remote' | 'hybrid'; label: string }[] = [
  { value: 'office', label: 'Office' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

const EMPLOYEE_CATEGORY_OPTIONS: { value: 'internal' | 'client_side'; label: string }[] = [
  { value: 'internal', label: 'Internal' },
  { value: 'client_side', label: 'Client Side' },
];

// Form key -> wire field name used by the profile change request (BasicUserField / 'title').
const FORM_TO_CHANGE_FIELD: Record<keyof EditEmployeeForm, BasicUserField | 'title'> = {
  title: 'title',
  first_name: 'firstName',
  last_name: 'lastName',
  email: 'email',
  department: 'department',
  position: 'position',
  career_path: 'careerPath',
  work_location: 'workLocation',
  employee_category: 'employeeCategory',
  hire_date: 'hireDate',
  device_id: 'deviceId',
};

const EMAIL_CHECK_DEBOUNCE_MS = 500;
const DUPLICATE_EMAIL_MESSAGE = 'Email address already exists. Please use a different email address.';
export const OFFICE_DOMAIN_MESSAGE = `Account Email must use the @${OFFICE_EMAIL_DOMAIN} domain.`;

function formFromEmployee(user: EmployeeDetail): EditEmployeeForm {
  return {
    title: (user.title || '') as '' | UserTitle,
    first_name: user.firstName || '',
    last_name: user.lastName || '',
    email: user.email || '',
    department: user.department || '',
    position: user.position || '',
    career_path: (user.careerPath || '') as '' | CareerPath,
    work_location: user.workLocation || '',
    employee_category: user.employeeCategory || '',
    hire_date: user.hireDate ? toIsoDay(user.hireDate) : '',
    device_id: user.deviceId || '',
  };
}

/** Builds one user_field change per edited field (OCD-650/651). `before` is the employee's saved value. */
export function buildBasicChanges(original: EditEmployeeForm, current: EditEmployeeForm): ProfileChangeItem[] {
  const changes: ProfileChangeItem[] = [];
  (Object.keys(FORM_TO_CHANGE_FIELD) as (keyof EditEmployeeForm)[]).forEach((key) => {
    const before = original[key].trim() === '' ? null : original[key].trim();
    const after = current[key].trim() === '' ? null : current[key].trim();
    if (before === after) return;
    changes.push({
      entityType: 'user_field',
      field: FORM_TO_CHANGE_FIELD[key],
      operation: 'update',
      before,
      after,
    } as ProfileChangeItem);
  });
  return changes;
}

function errorMessage(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { message?: string | string[]; error?: { message?: string } } } }).response
      ?.data;
    const message = data?.message ?? data?.error?.message;
    return Array.isArray(message) ? message[0] : message;
  }
  return undefined;
}

// Mounted unconditionally by the users page - keep router/query hooks out of the closed state.
export default function EditEmployeeModal(props: EditEmployeeModalProps) {
  if (!props.isOpen) return null;
  return <EditEmployeeModalContent {...props} />;
}

function EditEmployeeModalContent({
  isOpen,
  onClose,
  employeeUserId,
  canEdit,
  canEditFullProfile = false,
  onSaved,
}: EditEmployeeModalProps) {
  const toast = useToast();
  const router = useRouter();
  const submitChange = useSubmitProfileChangeMutation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const originalRef = useRef<EditEmployeeForm>(EMPTY_FORM);
  const lastCheckedEmail = useRef<string | null>(null);

  const form = useForm<EditEmployeeForm>({ defaultValues: EMPTY_FORM, mode: 'onChange' });
  const {
    register,
    watch,
    reset,
    setError,
    clearErrors,
    trigger,
    getValues,
    formState: { errors },
  } = form;
  const email = watch('email');

  // OCD-650: HR Manager / HR Executive edits go through the approval workflow rather than being applied.
  const requiresApproval = canEditFullProfile;

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
        const values = formFromEmployee(user);
        originalRef.current = values;
        lastCheckedEmail.current = values.email.trim();
        reset(values);
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

  // OCD-648: flag an already-used Account Email inline (debounced) instead of failing at save with a generic 500.
  const checkEmailAvailability = async (raw: string) => {
    const value = (raw || '').trim();
    if (!employeeUserId || !value || !EMAIL_PATTERN.test(value) || lastCheckedEmail.current === value) return;
    if (!value.toLowerCase().endsWith(`@${OFFICE_EMAIL_DOMAIN}`)) return;
    setCheckingEmail(true);
    try {
      const res = await api.get('/users/email-availability', { params: { email: value, excludeUserId: employeeUserId } });
      if (getValues('email').trim() !== value) return;
      lastCheckedEmail.current = value;
      if (res.data?.exists) {
        setError('email', { type: 'manual', message: DUPLICATE_EMAIL_MESSAGE });
      } else if (form.getFieldState('email').error?.type === 'manual') {
        clearErrors('email');
      }
    } catch {
      // Non-blocking - the server-side check at save is the real gate.
    } finally {
      setCheckingEmail(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !canEdit) return;
    const timer = setTimeout(() => void checkEmailAvailability(email), EMAIL_CHECK_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, isOpen]);

  const requiredFieldNames: FieldPath<EditEmployeeForm>[] = useMemo(
    () => [
      'first_name',
      'last_name',
      'email',
      'department',
      'position',
      'career_path',
      'work_location',
      'employee_category',
      'hire_date',
    ],
    []
  );

  /** Runs the field rules plus the duplicate-email check; returns true when the form can be submitted. */
  const validateAll = async (): Promise<boolean> => {
    const valid = await trigger(requiredFieldNames);
    if (!valid) return false;
    // trigger() clears the manual duplicate error, so re-check before allowing submission.
    const value = getValues('email').trim();
    if (employeeUserId && value && value !== originalRef.current.email.trim()) {
      try {
        const res = await api.get('/users/email-availability', { params: { email: value, excludeUserId: employeeUserId } });
        if (res.data?.exists) {
          setError('email', { type: 'manual', message: DUPLICATE_EMAIL_MESSAGE });
          return false;
        }
      } catch {
        // Non-blocking - the server-side check at save is the real gate.
      }
    }
    return true;
  };

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!employeeUserId) return;
    if (!(await validateAll())) return;
    const values = getValues();
    setSaving(true);
    try {
      if (requiresApproval) {
        const changes = buildBasicChanges(originalRef.current, values);
        if (changes.length === 0) {
          toast.info('No changes detected', 'Update at least one field before saving.');
          return;
        }
        await submitChange.mutateAsync({ changes, targetEmployeeId: employee?.employeeId || undefined });
        toast.success(
          'Change request submitted',
          'The changes will be applied once they have been approved. The employee profile is unchanged until then.'
        );
      } else {
        await api.put(`/users/${employeeUserId}`, {
          title: values.title,
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          email: values.email.trim(),
          department: values.department.trim(),
          position: values.position.trim(),
          career_path: values.career_path || undefined,
          work_location: values.work_location || undefined,
          employee_category: values.employee_category || undefined,
          hire_date: values.hire_date || undefined,
          device_id: values.device_id.trim(),
        });
        toast.success('Employee updated', 'Profile changes have been saved.');
      }
      onSaved?.();
      onClose();
    } catch (err: unknown) {
      const message = errorMessage(err);
      // Surface field-specific business errors inline instead of only as a toast (OCD-648/678).
      if (message && /email address already exists/i.test(message)) {
        setError('email', { type: 'manual', message: DUPLICATE_EMAIL_MESSAGE });
      } else if (message && /oxoholdings\.group/i.test(message)) {
        setError('email', { type: 'manual', message: OFFICE_DOMAIN_MESSAGE });
      }
      toast.error('Failed to save', message || 'Please check the form and try again');
    } finally {
      setSaving(false);
    }
  };

  // OCD-651: edits made here travel with the Edit Full Profile request instead of being silently dropped.
  const handleEditFullProfile = async () => {
    if (!employee) return;
    if (canEdit) {
      if (!(await validateAll())) return;
      stashPendingBasicChanges(employee.id, buildBasicChanges(originalRef.current, getValues()));
    }
    router.push(`/profile/wizard?userId=${employee.id}`);
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
        <div
          className="relative transform overflow-hidden rounded-2xl bg-[var(--card-bg)] text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-[var(--card-bg)] px-6 pt-6 pb-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 id="modal-title" className="text-2xl font-bold text-[var(--foreground)]">
                {canEdit ? 'Edit Employee' : 'Employee Details'}
              </h3>
              <button onClick={onClose} className="text-[var(--gray-400)] hover:text-[var(--foreground)] transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--primary)] border-t-transparent"></div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Employee ID">
                    <ReadOnly value={employee?.employeeId || 'N/A'} />
                  </Field>
                  <Field label="Role">
                    <ReadOnly value={employee?.role?.replace(/_/g, ' ') || 'N/A'} capitalize />
                  </Field>

                  <Field label="Title" error={errors.title?.message}>
                    {canEdit ? (
                      <select {...register('title')} className={selectClass}>
                        <option value="">Not set</option>
                        {TITLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <ReadOnly value={TITLE_OPTIONS.find((o) => o.value === employee?.title)?.label} />
                    )}
                  </Field>
                  <Field label="Device ID" error={errors.device_id?.message}>
                    {canEdit ? (
                      <input
                        type="text"
                        {...register('device_id', { validate: noEmoji })}
                        placeholder="Assigned device identifier"
                        className={inputClass}
                      />
                    ) : (
                      <ReadOnly value={employee?.deviceId} />
                    )}
                  </Field>

                  <Field label="First Name" required={canEdit} error={errors.first_name?.message}>
                    {canEdit ? (
                      <input
                        type="text"
                        {...register('first_name', {
                          required: 'First name is required',
                          validate: { noEmoji, notBlank: (v) => v.trim() !== '' || 'First name is required' },
                        })}
                        className={inputClass}
                      />
                    ) : (
                      <ReadOnly value={employee?.firstName} />
                    )}
                  </Field>
                  <Field label="Last Name" required={canEdit} error={errors.last_name?.message}>
                    {canEdit ? (
                      <input
                        type="text"
                        {...register('last_name', {
                          required: 'Last name is required',
                          validate: { noEmoji, notBlank: (v) => v.trim() !== '' || 'Last name is required' },
                        })}
                        className={inputClass}
                      />
                    ) : (
                      <ReadOnly value={employee?.lastName} />
                    )}
                  </Field>

                  <Field
                    label="Account Email"
                    required={canEdit}
                    error={errors.email?.message}
                    hint={checkingEmail ? 'Checking availability...' : undefined}
                    className="sm:col-span-2"
                  >
                    {canEdit ? (
                      <input
                        type="email"
                        {...register('email', {
                          required: 'Account email is required',
                          pattern: { value: EMAIL_PATTERN, message: 'Enter a valid email address' },
                          validate: (v) =>
                            v.trim().toLowerCase().endsWith(`@${OFFICE_EMAIL_DOMAIN}`) || OFFICE_DOMAIN_MESSAGE,
                          onBlur: (e) => void checkEmailAvailability(e.target.value),
                        })}
                        aria-invalid={!!errors.email}
                        className={`${inputClass} ${errors.email ? 'border-red-500' : ''}`}
                      />
                    ) : (
                      <ReadOnly value={employee?.email} />
                    )}
                  </Field>

                  <Field label="Department" required={canEdit} error={errors.department?.message}>
                    {canEdit ? (
                      <input
                        type="text"
                        {...register('department', {
                          required: 'Department is required',
                          validate: { noEmoji, notBlank: (v) => v.trim() !== '' || 'Department is required' },
                        })}
                        className={inputClass}
                      />
                    ) : (
                      <ReadOnly value={employee?.department} />
                    )}
                  </Field>
                  <Field label="Position" required={canEdit} error={errors.position?.message}>
                    {canEdit ? (
                      <input
                        type="text"
                        {...register('position', {
                          required: 'Position is required',
                          validate: { noEmoji, notBlank: (v) => v.trim() !== '' || 'Position is required' },
                        })}
                        className={inputClass}
                      />
                    ) : (
                      <ReadOnly value={employee?.position} />
                    )}
                  </Field>
                  <Field label="Related Career Path" required={canEdit} error={errors.career_path?.message}>
                    {canEdit ? (
                      <select {...register('career_path', { required: 'Related career path is required' })} className={selectClass}>
                        <option value="">Select</option>
                        {CAREER_PATH_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <ReadOnly value={careerPathLabel(employee?.careerPath)} />
                    )}
                  </Field>

                  <Field label="Work Location" required={canEdit} error={errors.work_location?.message}>
                    {canEdit ? (
                      <select {...register('work_location', { required: 'Work location is required' })} className={selectClass}>
                        <option value="">Select</option>
                        {WORK_LOCATION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <ReadOnly value={WORK_LOCATION_OPTIONS.find((o) => o.value === employee?.workLocation)?.label} />
                    )}
                  </Field>
                  <Field label="Employee Type" required={canEdit} error={errors.employee_category?.message}>
                    {canEdit ? (
                      <select
                        {...register('employee_category', { required: 'Employee type is required' })}
                        className={selectClass}
                      >
                        <option value="">Select</option>
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

                  <Field label="Hire Date" required={canEdit} error={errors.hire_date?.message}>
                    {canEdit ? (
                      <input
                        type="date"
                        {...register('hire_date', { required: 'Hire date is required' })}
                        className={inputClass}
                      />
                    ) : (
                      <ReadOnly value={employee?.hireDate ? toIsoDay(employee.hireDate) : undefined} />
                    )}
                  </Field>
                  <Field label="Account Status">
                    <ReadOnly value={employee?.status?.replace(/_/g, ' ') || 'Active'} capitalize />
                  </Field>
                </div>

                {requiresApproval && canEdit && (
                  <p className="text-xs font-medium text-[var(--gray-500)]">
                    Changes saved here are submitted for approval and applied only after they are approved.
                  </p>
                )}

                {canEditFullProfile && employee && (
                  <div className="rounded-lg border border-[var(--gray-100)] bg-[var(--gray-50)] p-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-medium text-[var(--gray-500)]">
                      Update this employee&apos;s full profile (statutory, remittance, family, education, work history). Any
                      changes made above are included in the same request, and everything is applied only after approval.
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleEditFullProfile()}
                      className="px-3 py-2 text-xs font-semibold text-[var(--primary)] bg-[var(--card-bg)] border border-[var(--primary)] rounded-lg hover:bg-[var(--primary-light)] transition-colors"
                    >
                      Edit Full Profile
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-sm font-semibold text-[var(--gray-600)] bg-[var(--card-bg)] border border-[var(--gray-200)] rounded-lg hover:bg-[var(--gray-50)] transition-colors"
                  >
                    {canEdit ? 'Cancel' : 'Close'}
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => void handleSave()}
                      disabled={saving}
                      className="px-4 py-2.5 text-sm font-semibold text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : requiresApproval ? 'Submit for Approval' : 'Save Changes'}
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

function ReadOnly({ value, capitalize = false }: { value?: string | null; capitalize?: boolean }) {
  return (
    <p
      className={`text-sm font-semibold text-[var(--foreground)] px-3.5 py-2.5 bg-[var(--gray-50)] rounded-lg border border-[var(--gray-100)] ${
        capitalize ? 'capitalize' : ''
      }`}
    >
      {value || '—'}
    </p>
  );
}
