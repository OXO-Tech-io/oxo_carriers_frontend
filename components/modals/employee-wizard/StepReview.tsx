import { UseFormReturn } from "react-hook-form";
import { UserRole } from "@/types";
import { useLeaveTypesQuery } from "@/hooks/queries/use-leave-types-query";
import { EmployeeWizardValues, calculateLeaveEntitlement } from "./wizardTypes";

interface StepProps {
  form: UseFormReturn<EmployeeWizardValues>;
}

export default function StepReview({ form }: Readonly<StepProps>) {
  const {
    register,
    formState: { errors },
  } = form;
  const values = form.watch();
  const leaveInfo = calculateLeaveEntitlement(values.hire_date);
  const isServiceProvider = values.role === UserRole.SERVICE_PROVIDER;

  // OCD-465: show Casual Leave alongside Annual Leave. Read from the real
  // configured leave types (same source as the Leaves page) rather than
  // hardcoding the days, so this stays correct if the entitlement changes.
  // Matches UsersService.create's own logic: only "annual"-named leave types
  // get pro-rated by hire date, everything else (including Casual) is
  // granted at its full configured max_days from day one.
  const { data: leaveTypes } = useLeaveTypesQuery();
  const casualLeaveType = leaveTypes?.find((lt) => lt.name.toLowerCase().includes("casual"));

  const name = isServiceProvider
    ? values.company_name || "Service Provider"
    : `${values.first_name} ${values.last_name}`.trim();

  return (
    <div className="space-y-4">
      <div className="bg-[var(--gray-25)] border border-[var(--gray-50)] rounded-lg p-4">
        <p className="text-sm font-semibold text-[var(--gray-600)] mb-3">Summary</p>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-[var(--gray-500)]">Name</dt>
            <dd className="font-medium text-[var(--foreground)]">{name || "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--gray-500)]">Role</dt>
            <dd className="font-medium text-[var(--foreground)]">{values.role}</dd>
          </div>
          <div>
            <dt className="text-[var(--gray-500)]">Email</dt>
            <dd className="font-medium text-[var(--foreground)]">{values.email || "—"}</dd>
          </div>
          {!isServiceProvider && (
            <>
              <div>
                <dt className="text-[var(--gray-500)]">Employee ID</dt>
                <dd className="font-medium text-[var(--foreground)]">
                  {values.employee_id || "Auto-generated"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--gray-500)]">Department</dt>
                <dd className="font-medium text-[var(--foreground)]">{values.department || "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--gray-500)]">Position</dt>
                <dd className="font-medium text-[var(--foreground)]">{values.position || "—"}</dd>
              </div>
            </>
          )}
        </dl>
      </div>

      {!isServiceProvider && (
        <div className="bg-[var(--gray-25)] border border-[var(--gray-50)] rounded-lg p-4">
          <p className="text-sm font-semibold text-[var(--gray-600)] mb-3">Profile Info</p>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt className="text-[var(--gray-500)]">NIC Number</dt>
              <dd className="font-medium text-[var(--foreground)]">{values.nationalId || "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--gray-500)]">Marital Status</dt>
              <dd className="font-medium text-[var(--foreground)] capitalize">{values.maritalStatus || "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--gray-500)]">Nominees</dt>
              <dd className="font-medium text-[var(--foreground)]">{values.nominees.length}</dd>
            </div>
            <div>
              <dt className="text-[var(--gray-500)]">Dependents</dt>
              <dd className="font-medium text-[var(--foreground)]">{values.dependents.length}</dd>
            </div>
            <div>
              <dt className="text-[var(--gray-500)]">Emergency Contacts</dt>
              <dd className="font-medium text-[var(--foreground)]">{values.emergencyContacts.length}</dd>
            </div>
          </dl>
        </div>
      )}

      {leaveInfo && values.role === UserRole.EMPLOYEE && (
        <div className="bg-[var(--success-light)] border border-[var(--success)]/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-5 w-5 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--success-text)] mb-1">
                Annual Leave Entitlement
              </p>
              <p className="text-xs text-[var(--success-text)] mb-2">
                Hired in {leaveInfo.quarter} • {leaveInfo.remainingMonths} months remaining in
                first year
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--card-bg)] rounded-lg p-2.5 border border-[var(--success)]/30">
                  <p className="text-xs text-[var(--success-text)] font-medium mb-1">
                    First Year ({new Date(values.hire_date).getFullYear()})
                  </p>
                  <p className="text-lg font-bold text-[var(--success-text)]">{leaveInfo.firstYear} days</p>
                  <p className="text-[10px] text-[var(--success-text)] mt-0.5">
                    0.5 days × {leaveInfo.remainingMonths} months
                  </p>
                </div>
                <div className="bg-[var(--card-bg)] rounded-lg p-2.5 border border-[var(--success)]/30">
                  <p className="text-xs text-[var(--success-text)] font-medium mb-1">Second Year Onwards</p>
                  <p className="text-lg font-bold text-[var(--success-text)]">
                    {leaveInfo.secondYearOnwards} days
                  </p>
                  <p className="text-[10px] text-[var(--success-text)] mt-0.5">Based on hire quarter</p>
                </div>
              </div>
              {casualLeaveType && (
                <div className="bg-[var(--card-bg)] rounded-lg p-2.5 border border-[var(--success)]/30 mt-3">
                  <p className="text-xs text-[var(--success-text)] font-medium mb-1">Casual Leave Entitlement</p>
                  <p className="text-lg font-bold text-[var(--success-text)]">{casualLeaveType.max_days} days</p>
                  <p className="text-[10px] text-[var(--success-text)] mt-0.5">Granted in full from the hire date</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!isServiceProvider ? (
        <div className="bg-[var(--primary-light)] border border-[var(--primary)]/30 rounded-lg p-4">
          <p className="text-sm text-[var(--gray-600)]">
            <strong>Note:</strong> The employee will receive an email with a link to set up their
            password. They must complete password setup before they can log in.
          </p>
        </div>
      ) : (
        <div className="bg-[var(--warning-light)] border border-[var(--warning)]/30 rounded-lg p-4">
          <p className="text-sm text-[var(--warning-text)]">
            <strong>Service Provider:</strong> This user will not receive a login or password
            setup email. They do not need to log in.
          </p>
        </div>
      )}

      {!isServiceProvider && (
        <div>
          <label className="flex items-start gap-3 bg-[var(--gray-25)] border border-[var(--gray-50)] rounded-lg p-4 cursor-pointer">
            <input
              type="checkbox"
              {...register("declarationAccepted", { required: "Please confirm the declaration before creating this employee" })}
              className="mt-0.5 h-4 w-4 rounded"
            />
            <span className="text-sm text-[var(--gray-600)]">
              I confirm that the information entered in this form is accurate and true to the best of my knowledge. *
            </span>
          </label>
          {errors.declarationAccepted && (
            <p className="text-xs text-red-500 mt-1">{errors.declarationAccepted.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
