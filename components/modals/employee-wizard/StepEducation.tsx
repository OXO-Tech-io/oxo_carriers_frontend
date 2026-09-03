import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { RepeatableCard } from "@/components/profile/wizard/shared";
import { QUALIFICATION_LEVEL_OPTIONS } from "@/types/profile";
import { Field, inputClass } from "./shared";
import { EmployeeWizardValues } from "./wizardTypes";

interface StepProps {
  form: UseFormReturn<EmployeeWizardValues>;
}

export default function StepEducation({ form }: Readonly<StepProps>) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "education" });
  const educationValues = watch("education");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Primary School Attended">
          <input {...register("primarySchoolAttended")} className={inputClass} />
        </Field>
        <Field label="Secondary School Attended">
          <input {...register("secondarySchoolAttended")} className={inputClass} />
        </Field>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-[#667085]">Add the employee's educational qualifications, if known.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              qualificationLevel: "",
              qualificationTitle: "",
              awardingInstitution: "",
              dateAwarded: "",
              isOngoing: false,
              remarks: "",
            })
          }
        >
          Add Qualification
        </Button>
      </div>
      {fields.length === 0 && <p className="text-xs text-[#98A2B3] font-medium">No qualifications added yet.</p>}
      {fields.map((f, index) => {
        const isOngoing = educationValues?.[index]?.isOngoing;
        return (
          <RepeatableCard key={f.id} title={`Qualification ${index + 1}`} onRemove={() => remove(index)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Qualification Level" error={errors.education?.[index]?.qualificationLevel?.message}>
                <select
                  {...register(`education.${index}.qualificationLevel`, { required: "Qualification level is required" })}
                  className={inputClass}
                >
                  <option value="">Select</option>
                  {QUALIFICATION_LEVEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Qualification Title" error={errors.education?.[index]?.qualificationTitle?.message}>
                <input
                  {...register(`education.${index}.qualificationTitle`, { required: "Qualification title is required" })}
                  placeholder="e.g. BSc (Hons) Computer Science"
                  className={inputClass}
                />
              </Field>
              <Field
                label="Awarding Institution"
                error={errors.education?.[index]?.awardingInstitution?.message}
                className="sm:col-span-2"
              >
                <input
                  {...register(`education.${index}.awardingInstitution`, { required: "Awarding institution is required" })}
                  placeholder="e.g. University of Colombo"
                  className={inputClass}
                />
              </Field>
              <Field label="Date Awarded">
                <input type="date" disabled={isOngoing} {...register(`education.${index}.dateAwarded`)} className={inputClass} />
              </Field>
              <Field label=" ">
                <label className="flex items-center gap-2 h-[42px]">
                  <input type="checkbox" {...register(`education.${index}.isOngoing`)} className="h-4 w-4 rounded" />
                  <span className="text-sm text-[#344054]">Currently pursuing this qualification</span>
                </label>
              </Field>
              <Field label="Remarks" className="sm:col-span-2">
                <textarea {...register(`education.${index}.remarks`)} rows={2} className={inputClass} />
              </Field>
            </div>
          </RepeatableCard>
        );
      })}
    </div>
  );
}
