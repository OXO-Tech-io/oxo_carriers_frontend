'use client';

import { ReactNode } from 'react';
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

// Generic step-progress header. Clicking a step only navigates if the caller
// passes onStepClick and the step isn't disabled (e.g. Tab C before marital
// status is set to Married) - this component has no opinion on validation,
// it just renders the progress state the wizard hands it.
export function Stepper({ steps, currentIndex, onStepClick }: StepperProps) {
  return (
    <div className="flex items-center w-full overflow-x-auto pb-2">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isComplete = index < currentIndex;
        const isClickable = !!onStepClick && !step.disabled;

        return (
          <div key={step.key} className="flex items-center flex-1 min-w-[110px] last:flex-none last:min-w-0">
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick?.(index)}
              className={`flex flex-col items-center gap-1.5 group ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span
                className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold border-2 transition-colors ${
                  isActive
                    ? 'bg-[var(--primary)] border-[var(--primary)] text-white'
                    : isComplete
                    ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]'
                    : step.disabled
                    ? 'bg-[var(--gray-50)] border-[var(--gray-100)] text-[var(--gray-300)]'
                    : 'bg-[var(--card-bg)] border-[var(--gray-200)] text-[var(--gray-400)]'
                }`}
              >
                {isComplete ? '✓' : index + 1}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider text-center whitespace-nowrap ${
                  isActive ? 'text-[var(--primary)]' : step.disabled ? 'text-[var(--gray-300)]' : 'text-[var(--gray-400)]'
                }`}
              >
                {step.label}
              </span>
            </button>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 rounded-full ${
                  index < currentIndex ? 'bg-[var(--primary)]' : 'bg-[var(--gray-100)]'
                }`}
              />
            )}
          </div>
        );
      })}
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
