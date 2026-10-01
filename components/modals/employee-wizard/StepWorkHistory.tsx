import { UseFormReturn, useFieldArray, useFormState } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { RepeatableCard } from "@/components/profile/wizard/shared";
import { EMPLOYMENT_TYPE_OPTIONS } from "@/types/profile";
import { noEmoji } from "@/lib/validation/textValidation";
import { Field, inputClass } from "./shared";
import { EmployeeWizardValues } from "./wizardTypes";

interface StepProps {
  form: UseFormReturn<EmployeeWizardValues>;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function StepWorkHistory({ form }: Readonly<StepProps>) {
  // React Compiler opt-out: the per-card `errors.workHistory?.[index]?...`
  // reads sit inside the fields.map() callback, so the compiler caches the
  // cards on the whole `errors` object - which react-hook-form mutates in
  // place, so its identity never changes.
  "use no memo";

  const { register, control, trigger } = form;
  // Subscribes this step to error updates itself. CreateUserModal is
  // compiled too and caches `<StepWorkHistory form={form} />` (`form` is a
  // stable reference), so reading `form.formState` here never re-renders the
  // step after "Next" runs trigger(["workHistory"]) - and no required /
  // "Emoji characters are not allowed" / date-order message would show.
  const { errors } = useFormState({ control, name: "workHistory" });
  const { fields, append, remove } = useFieldArray({ control, name: "workHistory" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--gray-500)]">Add the employee's previous work experience, if known.</p>
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
      {fields.length === 0 && <p className="text-xs text-[var(--gray-400)] font-medium">No previous work experience added yet.</p>}
      {fields.map((f, index) => (
        <RepeatableCard key={f.id} title={`Work Experience ${index + 1}`} onRemove={() => remove(index)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company / Organization" required error={errors.workHistory?.[index]?.organization?.message}>
              <input
                {...register(`workHistory.${index}.organization`, {
                  required: 'Organization is required',
                  validate: noEmoji,
                })}
                className={inputClass}
              />
            </Field>
            <Field label="Position Held" required error={errors.workHistory?.[index]?.positionHeld?.message}>
              <input
                {...register(`workHistory.${index}.positionHeld`, {
                  required: 'Position held is required',
                  validate: noEmoji,
                })}
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
            {/* OCD-418: neither Start Date nor End Date may be in the
                future, and End Date must not be earlier than Start Date.
                `max` blocks future dates at the date-picker level too, not
                just via the RHF validate message. Changing Start Date
                re-validates End Date since RHF only re-checks the field
                that changed by default. */}
            <Field label="Start Date" required error={errors.workHistory?.[index]?.startDate?.message}>
              <input
                type="date"
                max={todayIso()}
                {...register(`workHistory.${index}.startDate`, {
                  required: 'Start date is required',
                  validate: (value) => {
                    if (!value) return true;
                    if (value > todayIso()) return 'Start Date cannot be a future date.';
                    return true;
                  },
                  onChange: () => trigger(`workHistory.${index}.endDate`),
                })}
                className={inputClass}
              />
            </Field>
            <Field label="End Date (leave blank if current)" error={errors.workHistory?.[index]?.endDate?.message}>
              <input
                type="date"
                max={todayIso()}
                {...register(`workHistory.${index}.endDate`, {
                  validate: (value, formValues) => {
                    if (!value) return true;
                    if (value > todayIso()) return 'End Date cannot be a future date.';
                    const startDate = formValues.workHistory?.[index]?.startDate;
                    if (startDate && value < startDate) {
                      return 'End Date must be later than or equal to the Start Date.';
                    }
                    return true;
                  },
                })}
                className={inputClass}
              />
            </Field>
            <Field label="Remarks" className="sm:col-span-2">
              <textarea
                {...register(`workHistory.${index}.remarks`, { validate: noEmoji })}
                rows={2}
                className={inputClass}
              />
            </Field>
          </div>
        </RepeatableCard>
      ))}
    </div>
  );
}
