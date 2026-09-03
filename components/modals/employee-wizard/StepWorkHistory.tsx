import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { RepeatableCard } from "@/components/profile/wizard/shared";
import { EMPLOYMENT_TYPE_OPTIONS } from "@/types/profile";
import { Field, inputClass } from "./shared";
import { EmployeeWizardValues } from "./wizardTypes";

interface StepProps {
  form: UseFormReturn<EmployeeWizardValues>;
}

export default function StepWorkHistory({ form }: Readonly<StepProps>) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "workHistory" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#667085]">Add the employee's previous work experience, if known.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              organization: "",
              positionHeld: "",
              employmentType: "regular",
              startDate: "",
              endDate: "",
              remarks: "",
            })
          }
        >
          Add Work Experience
        </Button>
      </div>
      {fields.length === 0 && <p className="text-xs text-[#98A2B3] font-medium">No previous work experience added yet.</p>}
      {fields.map((f, index) => (
        <RepeatableCard key={f.id} title={`Work Experience ${index + 1}`} onRemove={() => remove(index)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company / Organization" error={errors.workHistory?.[index]?.organization?.message}>
              <input
                {...register(`workHistory.${index}.organization`, { required: 'Organization is required' })}
                className={inputClass}
              />
            </Field>
            <Field label="Position Held" error={errors.workHistory?.[index]?.positionHeld?.message}>
              <input
                {...register(`workHistory.${index}.positionHeld`, { required: 'Position held is required' })}
                className={inputClass}
              />
            </Field>
            <Field label="Employment Type">
              <select {...register(`workHistory.${index}.employmentType`)} className={inputClass}>
                {EMPLOYMENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Start Date" error={errors.workHistory?.[index]?.startDate?.message}>
              <input
                type="date"
                {...register(`workHistory.${index}.startDate`, { required: 'Start date is required' })}
                className={inputClass}
              />
            </Field>
            <Field label="End Date (leave blank if current)">
              <input type="date" {...register(`workHistory.${index}.endDate`)} className={inputClass} />
            </Field>
            <Field label="Remarks" className="sm:col-span-2">
              <textarea {...register(`workHistory.${index}.remarks`)} rows={2} className={inputClass} />
            </Field>
          </div>
        </RepeatableCard>
      ))}
    </div>
  );
}
