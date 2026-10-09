import { format } from 'date-fns';
import { DATE_FORMATS } from '@/lib/constants';

export type HalfDayPeriod = 'morning' | 'evening';

/** The slice of an existing leave request the conflict rules need. */
export interface ExistingLeave {
  start_date: string | Date;
  end_date: string | Date;
  status: string;
  is_half_day?: boolean;
  half_day_period?: HalfDayPeriod | null;
}

export interface LeaveSelection {
  startIso: string;
  endIso: string;
  isHalfDay: boolean;
  /** '' while a half-day request hasn't had its period picked yet. */
  period?: HalfDayPeriod | '';
}

const HALF_DAY_PERIODS: HalfDayPeriod[] = ['morning', 'evening'];

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The calendar day of a request date, in the viewer's timezone. The API sends a
 * DATE column as the instant of its local midnight - 2026-10-23 from a UTC+5:30
 * server arrives as "2026-10-22T18:30:00.000Z" - so slicing the string would land
 * on the previous day. Reading it as an instant matches the calendar markers and
 * the history table, which already do (OCD-593).
 */
export const toIsoDay = (value: string | Date) =>
  typeof value === 'string' && DATE_ONLY.test(value)
    ? value
    : format(new Date(value), DATE_FORMATS.ISO_DATE);

/**
 * Which of the viewer's existing pending/approved requests stops `selection`
 * from being submitted. Mirrors createLeaveRequest on the backend: a full-day
 * request is blocked by any overlap, but a half-day only by an overlapping
 * full-day request or a half-day for the same period - the other half of the
 * date stays bookable (OCD-593).
 */
export function findLeaveConflict(
  existing: ExistingLeave[],
  selection: LeaveSelection
): ExistingLeave | undefined {
  const overlapping = existing.filter(
    (leave) =>
      leave.status !== 'rejected' &&
      leave.status !== 'cancelled' &&
      toIsoDay(leave.start_date) <= selection.endIso &&
      toIsoDay(leave.end_date) >= selection.startIso
  );

  if (!selection.isHalfDay) return overlapping[0];

  const fullDay = overlapping.find((leave) => !leave.is_half_day);
  if (fullDay) return fullDay;

  if (selection.period) {
    return overlapping.find((leave) => leave.half_day_period === selection.period);
  }
  // No period picked yet: the date is only a dead end once neither half is free.
  const takenPeriods = new Set(overlapping.map((leave) => leave.half_day_period));
  return HALF_DAY_PERIODS.every((period) => takenPeriods.has(period))
    ? overlapping[0]
    : undefined;
}

export function getLeaveConflictMessage(
  selection: LeaveSelection,
  conflict: ExistingLeave
): string {
  const { startIso, endIso, isHalfDay, period } = selection;

  if (isHalfDay) {
    if (!conflict.is_half_day) {
      return `You already have a pending or approved full-day leave request on ${startIso}. Please choose a different date.`;
    }
    if (period) {
      return `You already have a pending or approved ${period} half-day leave request on ${startIso}. Please choose the other half of the day or a different date.`;
    }
    return `Both halves of ${startIso} are already covered by pending or approved leave requests. Please choose a different date.`;
  }

  if (startIso !== endIso) {
    return `You already have a pending or approved leave request between ${startIso} and ${endIso}. Please choose a different date range.`;
  }
  if (conflict.is_half_day) {
    return `You already have a pending or approved half-day leave request on ${startIso}. To request the other half of the day, enable "Half-day leave" and choose the free time period.`;
  }
  return `You already have a pending or approved leave request on ${startIso}. Please choose a different date.`;
}
