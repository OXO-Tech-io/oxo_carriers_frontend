import { UseFormReturn } from "react-hook-form";
import { noEmoji } from "@/lib/validation/textValidation";
import { Field, inputClass } from "./shared";
import { EmployeeWizardValues } from "./wizardTypes";

interface StepProps {
  form: UseFormReturn<EmployeeWizardValues>;
}

export default function StepBank({ form }: Readonly<StepProps>) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Bank Name" error={errors.bank_name?.message}>
        <input
          type="text"
          {...register("bank_name", { validate: noEmoji })}
          placeholder="e.g. Commercial Bank"
          className={inputClass}
        />
      </Field>
      <Field label="Account Holder Name" error={errors.account_holder_name?.message}>
        <input
          type="text"
          {...register("account_holder_name", { validate: noEmoji })}
          placeholder="Name as per bank account"
          className={inputClass}
        />
      </Field>
      <Field label="Account Number" error={errors.account_number?.message}>
        <input
          type="text"
          {...register("account_number", { validate: noEmoji })}
          placeholder="Bank account number"
          className={inputClass}
        />
      </Field>
      <Field label="Branch" error={errors.bank_branch?.message}>
        <input
          type="text"
          {...register("bank_branch", { validate: noEmoji })}
          placeholder="Branch name or code"
          className={inputClass}
        />
      </Field>
    </div>
  );
}
