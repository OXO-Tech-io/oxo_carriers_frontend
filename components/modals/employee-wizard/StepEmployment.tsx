import { UseFormReturn } from "react-hook-form";
import { UserRole } from "@/types";
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Department">
          <input type="text" {...register("department")} className={inputClass} />
        </Field>
        <Field label="Position">
          <input type="text" {...register("position")} className={inputClass} />
        </Field>
      </div>
      <Field label="Hire Date">
        <input type="date" {...register("hire_date")} className={inputClass} />
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
