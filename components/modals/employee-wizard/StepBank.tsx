import { UseFormReturn } from "react-hook-form";
import { Field, inputClass } from "./shared";
import { EmployeeWizardValues } from "./wizardTypes";

interface StepProps {
  form: UseFormReturn<EmployeeWizardValues>;
}

export default function StepBank({ form }: StepProps) {
  const { register } = form;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Bank Name">
        <input
          type="text"
          {...register("bank_name")}
          placeholder="e.g. Commercial Bank"
          className={inputClass}
        />
      </Field>
      <Field label="Account Holder Name">
        <input
          type="text"
          {...register("account_holder_name")}
          placeholder="Name as per bank account"
          className={inputClass}
        />
      </Field>
      <Field label="Account Number">
        <input
          type="text"
          {...register("account_number")}
          placeholder="Bank account number"
          className={inputClass}
        />
      </Field>
      <Field label="Branch">
        <input
          type="text"
          {...register("bank_branch")}
          placeholder="Branch name or code"
          className={inputClass}
        />
      </Field>
    </div>
  );
}
