'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export function Card({ children, className = '', padding = 'md', hover = false }: CardProps) {
  const paddingClass = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }[padding];

  return (
    <div
      className={`
        rounded-2xl bg-[var(--card-bg)] border border-[var(--gray-200)]
        shadow-[var(--shadow)] transition-all duration-200
        ${paddingClass} ${className}
        ${hover ? 'hover:shadow-[var(--shadow-md)] hover:border-[var(--gray-300)]' : ''}
      `}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] tracking-tight">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-[var(--gray-500)]">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
