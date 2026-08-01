import { ReactNode } from "react";

export const inputClass =
  "block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent";

export const selectClass =
  "block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm font-medium text-[#344054] bg-white focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent";

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
      <label className="block text-sm font-semibold text-[#344054] mb-2">
        {label}
        {required && " *"}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-[#667085] mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
