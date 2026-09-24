import { useEffect, useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import api from "@/lib/api";
import { UserRole } from "@/types";
import { TITLE_OPTIONS } from "@/types/profile";
import { EMAIL_PATTERN, noEmoji } from "@/lib/validation/textValidation";
import { Field, inputClass, selectClass } from "./shared";
import { EmployeeWizardValues } from "./wizardTypes";

interface StepProps {
  form: UseFormReturn<EmployeeWizardValues>;
  currentUserRole?: UserRole;
}

// OCD-436: check the work email for uniqueness as soon as the user leaves
// the field, instead of only at final submission. Debounced so we're not
// firing a request on every keystroke; the final-submission check in
// UsersService.create stays in place as a safety net (e.g. a race with
// another HR user creating the same email in the meantime).
const EMAIL_CHECK_DEBOUNCE_MS = 500;

export default function StepBasicInfo({ form, currentUserRole }: StepProps) {
  const {
    register,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = form;

  const role = watch("role");
  const isServiceProvider = role === UserRole.SERVICE_PROVIDER;
  const email = watch("email");

  const [checkingEmail, setCheckingEmail] = useState(false);
  const lastCheckedRef = useRef<string | null>(null);

  useEffect(() => {
    const value = (email || "").trim();
    lastCheckedRef.current = null;
    if (!value || !EMAIL_PATTERN.test(value)) {
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const response = await api.get("/users/email-availability", { params: { email: value } });
        // Bail if the field changed while the request was in flight.
        if (watch("email") !== value) return;
        lastCheckedRef.current = value;
        if (response.data?.exists) {
          setError("email", {
            type: "manual",
            message: "Email address already exists. Please use a different email address.",
          });
        } else if (errors.email?.type === "manual") {
          clearErrors("email");
        }
      } catch {
        // Non-blocking: if the availability check itself fails (network,
        // auth, etc.) we don't want to trap the user on this step - the
        // final-submission duplicate check still guards against it.
      } finally {
        setCheckingEmail(false);
      }
    }, EMAIL_CHECK_DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

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
          {/* OCD-448: HR Manager is a configured role (UserRole.HR_MANAGER)
              but was only ever offered to a requester who was themselves
              already an HR Manager - nothing server-side restricts who may
              assign it, so it's shown unconditionally like the other
              HR/Finance roles below. Only Super Admin (assigned server-side
              only to another Super Admin) stays gated. */}
          <option value={UserRole.HR_MANAGER}>HR Manager</option>
          <option value={UserRole.FINANCE_EXECUTIVE}>Finance Executive</option>
          <option value={UserRole.FINANCE_MANAGER}>Finance Manager</option>
          {currentUserRole === UserRole.SUPER_ADMIN && (
            <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
          )}
        </select>
      </Field>

      {!isServiceProvider && (
        <>
          <Field
            label="Employee ID"
            hint="Optional: Leave blank to auto-generate based on year"
            error={errors.employee_id?.message}
          >
            <input
              type="text"
              {...register("employee_id", { validate: noEmoji })}
              placeholder="Leave empty to auto-generate (e.g., EMP20260001)"
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Title" error={errors.title?.message}>
              <select {...register("title")} className={selectClass}>
                <option value="">Not set</option>
                {TITLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
            <div />
            <Field label="First Name" required error={errors.first_name?.message}>
              <input
                type="text"
                {...register("first_name", { required: "First name is required", validate: noEmoji })}
                className={inputClass}
              />
            </Field>
            <Field label="Last Name" required error={errors.last_name?.message}>
              <input
                type="text"
                {...register("last_name", { required: "Last name is required", validate: noEmoji })}
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
              {...register("company_name", { required: "Company name is required", validate: noEmoji })}
              placeholder="Company or organization name"
              className={inputClass}
            />
          </Field>
          <Field
            label="Email"
            required
            error={errors.email?.message}
            hint={checkingEmail ? "Checking availability..." : undefined}
          >
            <input
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: { value: EMAIL_PATTERN, message: "Enter a valid email address" },
              })}
              className={inputClass}
            />
          </Field>
          <Field label="Contact Number" error={errors.contact_number?.message}>
            <input
              type="text"
              {...register("contact_number", { validate: noEmoji })}
              placeholder="e.g. +94 77 123 4567"
              className={inputClass}
            />
          </Field>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Email"
            required
            error={errors.email?.message}
            hint={checkingEmail ? "Checking availability..." : undefined}
          >
            <input
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: { value: EMAIL_PATTERN, message: "Enter a valid email address" },
              })}
              className={inputClass}
            />
          </Field>
          <Field label="Personal Email Address" required error={errors.personalEmail?.message}>
            <input
              type="email"
              {...register("personalEmail", {
                required: "Personal email address is required",
                pattern: { value: EMAIL_PATTERN, message: "Enter a valid email address" },
              })}
              placeholder="Personal contact email, separate from the login email above"
              className={inputClass}
            />
          </Field>
        </div>
      )}
    </div>
  );
}
