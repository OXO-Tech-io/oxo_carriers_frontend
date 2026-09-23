import type { KeyboardEvent } from 'react';

/** 24 hours, in minutes - worklog time is recorded in minutes per the requirements doc. */
export const MAX_MINUTES_PER_DAY = 1440;

export const todayIso = () => new Date().toISOString().slice(0, 10);

/** A single worklog entry's minutes must be a whole number in (0, 1440]. */
export const isValidMinutes = (minutes: number): boolean =>
  Number.isInteger(minutes) && minutes > 0 && minutes <= MAX_MINUTES_PER_DAY;

export const isFutureDate = (workDate: string): boolean => !!workDate && workDate > todayIso();

/**
 * Blocks keystrokes a number input would otherwise happily accept but that
 * make no sense for a minutes field: the exponent marker, unary +, minus, and
 * decimal point (minutes are always whole numbers). Spinner controls already
 * clamp to [0, 1440] on their own - this closes the same gap for typed input
 * (see OCD-458).
 */
export function blockInvalidMinutesKeys(e: KeyboardEvent<HTMLInputElement>): void {
  if (['e', 'E', '+', '-', '.'].includes(e.key)) {
    e.preventDefault();
  }
}

/** Clamps a raw number-input value into the valid minutes range, keeping it a whole number. */
export function clampMinutes(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_MINUTES_PER_DAY, Math.trunc(value)));
}

/** Sums minutes per work date, for the client-side 24h/day cap check (see OCD-460). */
export function minutesByDate(entries: { workDate: string; minutesSpent: number }[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    totals.set(entry.workDate, (totals.get(entry.workDate) ?? 0) + entry.minutesSpent);
  }
  return totals;
}
