'use client';

import { ReactNode } from 'react';

export const inputClass =
  'block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:bg-[var(--gray-25)] disabled:text-[var(--gray-400)]';

export const labelClass = 'block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2';

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

// OCD-411/OCD-416/OCD-420/OCD-429: `required` renders a consistent asterisk
// marker, `hint` renders persistent format guidance below the field (e.g.
// accepted NIC/mobile formats) - suppressed once an error takes its place so
// the two don't stack.
export function Field({ label, required, hint, error, className = '', children }: FieldProps) {
  return (
    <div className={className}>
      <label className={labelClass}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-[var(--gray-400)]">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <p className="text-[10px] font-bold text-[var(--gray-500)] uppercase tracking-wider">{children}</p>;
}

export function RepeatableCard({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="bg-[var(--gray-25)] p-4 rounded-2xl border border-[var(--gray-50)] space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle>{title}</SectionTitle>
        <button
          type="button"
          onClick={onRemove}
          className="text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-600"
        >
          Remove
        </button>
      </div>
      {children}
    </div>
  );
}
