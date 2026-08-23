'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface StepDefinition {
  key: string;
  label: string;
  disabled?: boolean;
}

interface StepperProps {
  steps: StepDefinition[];
  currentIndex: number;
  onStepClick?: (index: number) => void;
}

// Progress bar + "Step N of M" caption, with a "View all steps" panel for
// jumping around. Replaces the old always-all-labels-visible row, which
// overlapped once a wizard grew past ~8 steps or picked up two-word labels
// (its flex-1 cells shrink below the label's natural width, and the
// unwrapped text spills onto the neighboring cell instead of scrolling).
// Clicking a step only navigates if the caller passes onStepClick and the
// step isn't disabled (e.g. Tab C before marital status is set to Married) -
// this component has no opinion on validation, it just renders the progress
// state the wizard hands it.
export function Stepper({ steps, currentIndex, onStepClick }: StepperProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = steps[currentIndex];

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <p className="text-xs font-bold text-[var(--foreground)]">
          Step {currentIndex + 1} of {steps.length}
          {current && <span className="ml-1.5 font-medium text-[var(--gray-400)]">&middot; {current.label}</span>}
        </p>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex items-center gap-1.5 rounded-full border border-[var(--gray-100)] bg-[var(--card-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--gray-500)] hover:border-[var(--gray-200)] transition-colors cursor-pointer"
        >
          View all steps
          <svg
            className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      <div className="flex gap-1">
        {steps.map((step, index) => {
          const isDone = index <= currentIndex;
          return (
            <div
              key={step.key}
              className={`h-1.5 flex-1 rounded-full ${
                isDone ? 'bg-[var(--primary)]' : step.disabled ? 'bg-[var(--gray-50)]' : 'bg-[var(--gray-100)]'
              }`}
            />
          );
        })}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 grid grid-cols-2 gap-0.5 rounded-2xl border border-[var(--gray-100)] bg-[var(--card-bg)] p-2.5 shadow-[var(--shadow-lg)]">
          {steps.map((step, index) => {
            const isActive = index === currentIndex;
            const isComplete = index < currentIndex;
            const isClickable = !!onStepClick && !step.disabled;

            return (
              <button
                key={step.key}
                type="button"
                disabled={!isClickable}
                onClick={() => {
                  if (!isClickable) return;
                  onStepClick?.(index);
                  setOpen(false);
                }}
                className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${
                  isClickable ? 'cursor-pointer hover:bg-[var(--gray-25)]' : 'cursor-default'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    isActive
                      ? 'bg-[var(--primary)] text-white'
                      : isComplete
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                      : step.disabled
                      ? 'bg-[var(--gray-50)] text-[var(--gray-300)]'
                      : 'bg-[var(--gray-50)] text-[var(--gray-400)]'
                  }`}
                >
                  {isComplete ? '✓' : index + 1}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    isActive ? 'text-[var(--foreground)]' : step.disabled ? 'text-[var(--gray-300)]' : 'text-[var(--gray-500)]'
                  }`}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface StepPanelProps {
  stepKey: string;
  children: ReactNode;
}

// Fade/slide transition between steps, matching the framer-motion convention
// already used by the tab-pill profile page.
export function StepPanel({ stepKey, children }: StepPanelProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.18 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
