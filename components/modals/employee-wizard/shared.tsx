import { ReactNode } from "react";

// OCD-414: this wizard is rendered inside the same CreateUserModal stepper as
// components/profile/wizard's steps (Statutory/Remittance/Dependents/etc.),
// so its fields must follow the same dark-mode convention as that sibling
// shared.tsx - CSS custom properties (--foreground/--card-bg/--gray-*/--primary)
// that flip via the `.dark` class on <html> (see contexts/ThemeContext.tsx and
// app/globals.css) - rather than hardcoded light hex values. Previously these
// were hardcoded (#D0D5DD/#101828/#98A2B3/#465FFF/bg-white), which is why
// this wizard's own steps stayed light-themed while the shared steps went
// dark, producing the inconsistent per-step styling reported in OCD-414.
export const inputClass =
  "block w-full px-3 py-2.5 border border-[var(--gray-100)] rounded-lg text-sm text-[var(--foreground)] bg-[var(--card-bg)] placeholder-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent";

export const selectClass =
  "block w-full px-3 py-2.5 border border-[var(--gray-100)] rounded-lg text-sm font-medium text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent";

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ label, required, hint, error, className = "", children }: FieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-[var(--gray-600)] mb-2">
        {label}
        {required && " *"}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-[var(--gray-500)] mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
