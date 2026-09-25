import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { RepeatableCard } from "@/components/profile/wizard/shared";
import { QUALIFICATION_LEVEL_OPTIONS } from "@/types/profile";
import { noEmoji, noFutureDate } from "@/lib/validation/textValidation";
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
    trigger,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "education" });
  const educationValues = watch("education");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Primary School Attended" required error={errors.primarySchoolAttended?.message}>
          <input
            {...register("primarySchoolAttended", {
              required: "Primary School Attended is required",
              validate: noEmoji,
            })}
            className={inputClass}
          />
        </Field>
        <Field label="Secondary School Attended" required error={errors.secondarySchoolAttended?.message}>
          <input
            {...register("secondarySchoolAttended", {
              required: "Secondary School Attended is required",
              validate: noEmoji,
            })}
            className={inputClass}
          />
        </Field>
      </div>

      {/* OCD-477: parity with the "Undergraduate Degree Completion Date"
          card on My Profile's Education tab - a single employee-level field,
          separate from the repeatable qualifications below. */}
      <Field label="Undergraduate Degree Completion Date" error={errors.undergraduateDegreeCompletionDate?.message}>
        <input
          type="date"
          {...register("undergraduateDegreeCompletionDate")}
          className={inputClass}
        />
      </Field>

      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--gray-500)]">Add the employee's educational qualifications, if known.</p>
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
      {fields.length === 0 && <p className="text-xs text-[var(--gray-400)] font-medium">No qualifications added yet.</p>}
      {fields.map((f, index) => {
        const isOngoing = educationValues?.[index]?.isOngoing;
        return (
          <RepeatableCard key={f.id} title={`Qualification ${index + 1}`} onRemove={() => remove(index)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Qualification Level"
                required
                error={errors.education?.[index]?.qualificationLevel?.message}
              >
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
              <Field
                label="Qualification Title"
                required
                error={errors.education?.[index]?.qualificationTitle?.message}
              >
                <input
                  {...register(`education.${index}.qualificationTitle`, {
                    required: "Qualification title is required",
                    validate: noEmoji,
                  })}
                  placeholder="e.g. BSc (Hons) Computer Science"
                  className={inputClass}
                />
              </Field>
              <Field
                label="Awarding Institution"
                required
                error={errors.education?.[index]?.awardingInstitution?.message}
                className="sm:col-span-2"
              >
                <input
                  {...register(`education.${index}.awardingInstitution`, {
                    required: "Awarding institution is required",
                    validate: noEmoji,
                  })}
                  placeholder="e.g. University of Colombo"
                  className={inputClass}
                />
              </Field>
              <Field
                label="Date Awarded"
                required={!isOngoing}
                error={errors.education?.[index]?.dateAwarded?.message}
              >
                <input
                  type="date"
                  disabled={isOngoing}
                  {...register(`education.${index}.dateAwarded`, {
                    validate: {
                      required: (value) => {
                        if (isOngoing) return true;
                        return !!value || "Date awarded is required unless this qualification is currently being pursued";
                      },
                      noFutureDate,
                    },
                  })}
                  className={inputClass}
                />
              </Field>
              <Field label=" ">
                <label className="flex items-center gap-2 h-[42px]">
                  <input
                    type="checkbox"
                    {...register(`education.${index}.isOngoing`, {
                      onChange: () => trigger(`education.${index}.dateAwarded`),
                    })}
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm text-[var(--gray-600)]">Currently pursuing this qualification</span>
                </label>
              </Field>
              <Field label="Remarks" className="sm:col-span-2">
                <textarea
                  {...register(`education.${index}.remarks`, { validate: noEmoji })}
                  rows={2}
                  className={inputClass}
                />
              </Field>
            </div>
          </RepeatableCard>
        );
      })}
    </div>
  );
}
