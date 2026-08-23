import { UseFormReturn } from "react-hook-form";
import { UserRole } from "@/types";
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

  const name = isServiceProvider
    ? values.company_name || "Service Provider"
    : `${values.first_name} ${values.last_name}`.trim();

  return (
    <div className="space-y-4">
      <div className="bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg p-4">
        <p className="text-sm font-semibold text-[#344054] mb-3">Summary</p>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-[#667085]">Name</dt>
            <dd className="font-medium text-[#101828]">{name || "—"}</dd>
          </div>
          <div>
            <dt className="text-[#667085]">Role</dt>
            <dd className="font-medium text-[#101828]">{values.role}</dd>
          </div>
          <div>
            <dt className="text-[#667085]">Email</dt>
            <dd className="font-medium text-[#101828]">{values.email || "—"}</dd>
          </div>
          {!isServiceProvider && (
            <>
              <div>
                <dt className="text-[#667085]">Employee ID</dt>
                <dd className="font-medium text-[#101828]">
                  {values.employee_id || "Auto-generated"}
                </dd>
              </div>
              <div>
                <dt className="text-[#667085]">Department</dt>
                <dd className="font-medium text-[#101828]">{values.department || "—"}</dd>
              </div>
              <div>
                <dt className="text-[#667085]">Position</dt>
                <dd className="font-medium text-[#101828]">{values.position || "—"}</dd>
              </div>
            </>
          )}
        </dl>
      </div>

      {!isServiceProvider && (
        <div className="bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg p-4">
          <p className="text-sm font-semibold text-[#344054] mb-3">Profile Info</p>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt className="text-[#667085]">NIC Number</dt>
              <dd className="font-medium text-[#101828]">{values.nationalId || "—"}</dd>
            </div>
            <div>
              <dt className="text-[#667085]">Marital Status</dt>
              <dd className="font-medium text-[#101828] capitalize">{values.maritalStatus || "—"}</dd>
            </div>
            <div>
              <dt className="text-[#667085]">Nominees</dt>
              <dd className="font-medium text-[#101828]">{values.nominees.length}</dd>
            </div>
            <div>
              <dt className="text-[#667085]">Dependents</dt>
              <dd className="font-medium text-[#101828]">{values.dependents.length}</dd>
            </div>
            <div>
              <dt className="text-[#667085]">Emergency Contacts</dt>
              <dd className="font-medium text-[#101828]">{values.emergencyContacts.length}</dd>
            </div>
          </dl>
        </div>
      )}

      {leaveInfo && values.role === UserRole.EMPLOYEE && (
        <div className="bg-[var(--success-light)] border border-[var(--success)]/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-900 mb-1">
                Annual Leave Entitlement
              </p>
              <p className="text-xs text-emerald-700 mb-2">
                Hired in {leaveInfo.quarter} • {leaveInfo.remainingMonths} months remaining in
                first year
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-2.5 border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-medium mb-1">
                    First Year ({new Date(values.hire_date).getFullYear()})
                  </p>
                  <p className="text-lg font-bold text-emerald-900">{leaveInfo.firstYear} days</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">
                    0.5 days × {leaveInfo.remainingMonths} months
                  </p>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-medium mb-1">Second Year Onwards</p>
                  <p className="text-lg font-bold text-emerald-900">
                    {leaveInfo.secondYearOnwards} days
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">Based on hire quarter</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isServiceProvider ? (
        <div className="bg-[#ECF3FF] border border-[#DDE9FF] rounded-lg p-4">
          <p className="text-sm text-[#344054]">
            <strong>Note:</strong> The employee will receive an email with a link to set up their
            password. They must complete password setup before they can log in.
          </p>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>Service Provider:</strong> This user will not receive a login or password
            setup email. They do not need to log in.
          </p>
        </div>
      )}

      {!isServiceProvider && (
        <div>
          <label className="flex items-start gap-3 bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg p-4 cursor-pointer">
            <input
              type="checkbox"
              {...register("declarationAccepted", { required: "Please confirm the declaration before creating this employee" })}
              className="mt-0.5 h-4 w-4 rounded"
            />
            <span className="text-sm text-[#344054]">
              I confirm that the information entered in this form is accurate and true to the best of my knowledge.
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
