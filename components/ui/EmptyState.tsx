'use client';

import { ReactNode } from 'react';
import { Inbox, type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed border-[var(--gray-200)] bg-[var(--gray-25)]">
      <div className="p-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--gray-100)] text-[var(--gray-400)] mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-sm font-bold text-[var(--foreground)]">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-[var(--gray-400)] max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
