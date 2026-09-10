import { UseFormReturn } from "react-hook-form";
import { UserRole } from "@/types";
import { WORK_LOCATION_OPTIONS } from "@/types/profile";
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
        <Field label="Department">
          <input type="text" {...register("department")} className={inputClass} />
        </Field>
        <Field label="Position">
          <input type="text" {...register("position")} className={inputClass} />
        </Field>
      </div>
      <Field label="Work Location">
        <select {...register("work_location")} className={inputClass}>
          <option value="">Select</option>
          {WORK_LOCATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Hire Date">
        <input type="date" {...register("hire_date")} className={inputClass} />
      </Field>
      <Field
        label="Device ID"
        hint="Identifies this employee's local PC agent for real-time in/out/break sync. Leave blank if not assigned yet."
      >
        <input type="text" {...register("device_id")} placeholder="e.g. WKS-0042" className={inputClass} />
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
