import { UseFormReturn } from "react-hook-form";
import { UserRole } from "@/types";
import { WORK_LOCATION_OPTIONS } from "@/types/profile";
import { noEmoji, noFutureDate } from "@/lib/validation/textValidation";
import { Field, inputClass } from "./shared";
import { EmployeeWizardValues } from "./wizardTypes";

interface StepProps {
  form: UseFormReturn<EmployeeWizardValues>;
}

export default function StepEmployment({ form }: StepProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;

  const role = watch("role");
  const isConsultant = role === UserRole.CONSULTANT;

  return (
    <div className="space-y-4">
      <Field label="Employee Type" required error={errors.employee_category?.message}>
        <select
          {...register("employee_category", { required: "Employee Type is required" })}
          className={inputClass}
        >
          <option value="">Select</option>
          <option value="internal">Internal</option>
          <option value="client_side">Client Side</option>
        </select>
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Department" error={errors.department?.message}>
          <input type="text" {...register("department", { validate: noEmoji })} className={inputClass} />
        </Field>
        <Field label="Position" required error={errors.position?.message}>
          <input
            type="text"
            {...register("position", { required: "Position is required", validate: noEmoji })}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Work Location" required error={errors.work_location?.message}>
        <select {...register("work_location", { required: "Work Location is required" })} className={inputClass}>
          <option value="">Select</option>
          {WORK_LOCATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Hire Date" required error={errors.hire_date?.message}>
        <input
          type="date"
          {...register("hire_date", { required: "Hire Date is required", validate: noFutureDate })}
          className={inputClass}
        />
      </Field>
      {isConsultant && (
        <Field
          label="Hourly Rate"
          required
          hint="Required for Consultant role"
          error={errors.hourly_rate?.message}
        >
          <input
            type="number"
            min={0}
            step={0.01}
            {...register("hourly_rate", { required: "Hourly rate is required for consultants" })}
            placeholder="e.g. 50.00"
            className={inputClass}
          />
        </Field>
      )}
    </div>
  );
}
