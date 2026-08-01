import { UseFormReturn } from "react-hook-form";
import { UserRole } from "@/types";
import { Field, inputClass, selectClass } from "./shared";
import { EmployeeWizardValues } from "./wizardTypes";

interface StepProps {
  form: UseFormReturn<EmployeeWizardValues>;
  currentUserRole?: UserRole;
}

export default function StepBasicInfo({ form, currentUserRole }: StepProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const role = watch("role");
  const isServiceProvider = role === UserRole.SERVICE_PROVIDER;

  return (
    <div className="space-y-4">
      <Field label="Role" required>
        <select
          {...register("role", {
            onChange: (e) => {
              if (e.target.value !== UserRole.CONSULTANT) {
                setValue("hourly_rate", "");
              }
            },
          })}
          className={selectClass}
        >
          <option value={UserRole.EMPLOYEE}>Employee</option>
          <option value={UserRole.CONSULTANT}>Consultant</option>
          <option value={UserRole.HR_EXECUTIVE}>HR Executive</option>
          <option value={UserRole.FINANCE_EXECUTIVE}>Finance Executive</option>
          <option value={UserRole.FINANCE_MANAGER}>Finance Manager</option>
          {currentUserRole === UserRole.HR_MANAGER && (
            <option value={UserRole.HR_MANAGER}>HR Manager</option>
          )}
        </select>
      </Field>

      {!isServiceProvider && (
        <>
          <Field label="Employee ID" hint="Optional: Leave blank to auto-generate based on year">
            <input
              type="text"
              {...register("employee_id")}
              placeholder="Leave empty to auto-generate (e.g., EMP20260001)"
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="First Name" required error={errors.first_name?.message}>
              <input
                type="text"
                {...register("first_name", { required: "First name is required" })}
                className={inputClass}
              />
            </Field>
            <Field label="Last Name" required error={errors.last_name?.message}>
              <input
                type="text"
                {...register("last_name", { required: "Last name is required" })}
                className={inputClass}
              />
            </Field>
          </div>
        </>
      )}

      {isServiceProvider ? (
        <>
          <Field label="Company Name" required error={errors.company_name?.message}>
            <input
              type="text"
              {...register("company_name", { required: "Company name is required" })}
              placeholder="Company or organization name"
              className={inputClass}
            />
          </Field>
          <Field label="Email" required error={errors.email?.message}>
            <input
              type="email"
              {...register("email", { required: "Email is required" })}
              className={inputClass}
            />
          </Field>
          <Field label="Contact Number">
            <input
              type="text"
              {...register("contact_number")}
              placeholder="e.g. +94 77 123 4567"
              className={inputClass}
            />
          </Field>
        </>
      ) : (
        <Field label="Email" required error={errors.email?.message}>
          <input
            type="email"
            {...register("email", { required: "Email is required" })}
            className={inputClass}
          />
        </Field>
      )}
    </div>
  );
}
