'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, isWeekend, isSameDay, startOfDay, endOfDay } from 'date-fns';
import api from '@/lib/api';

interface LeaveCalendarEntry {
  id: number;
  date: string;
  name: string;
  description?: string;
  is_recurring: boolean;
  year?: number;
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

// Short instructional banner above the calendar, matching how a step-by-step
// range picker guides the user: what to do next, updated as they pick dates.
function RangeHint({ startDate, endDate }: { startDate: Date | null; endDate: Date | null }) {
  let text = 'Select a start date, then an end date.';
  if (startDate && !endDate) text = 'Now choose your end date.';
  if (startDate && endDate) text = 'Date range selected.';
  return (
    <div className="date-range-hint">
      <CalendarIcon />
      <span>{text}</span>
    </div>
  );
}

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  selectsRange?: boolean;
  inline?: boolean;
  monthsShown?: number;
  showHolidays?: boolean;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onChange,
  minDate,
  maxDate,
  disabled = false,
  selectsRange = true,
  inline = false,
  monthsShown = 2,
  showHolidays = true,
}: DateRangePickerProps) {
  const [holidays, setHolidays] = useState<LeaveCalendarEntry[]>([]);
  const [loadingHolidays, setLoadingHolidays] = useState(false);

  const fetchHolidays = async () => {
    try {
      setLoadingHolidays(true);
      const currentYear = new Date().getFullYear();
      const start = new Date(currentYear - 1, 0, 1);
      const end = new Date(currentYear + 1, 11, 31);
      
      const response = await api.get(
        `/leave-calendars/range?startDate=${format(start, 'yyyy-MM-dd')}&endDate=${format(end, 'yyyy-MM-dd')}`
      );
      setHolidays(response.data.data || []);
    } catch (err) {
      console.error('Error fetching holidays:', err);
    } finally {
      setLoadingHolidays(false);
    }
  };

  useEffect(() => {
    if (showHolidays) {
      fetchHolidays();
    }
  }, [showHolidays]);

  // Check if a date is a holiday (including weekends)
  const isHoliday = (date: Date): boolean => {
    if (isWeekend(date)) return true;
    return holidays.some(holiday => {
      const holidayDate = new Date(holiday.date);
      return isSameDay(holidayDate, date);
    });
  };

  // Get holiday name for a date
  const getHolidayName = (date: Date): string | null => {
    if (isWeekend(date)) {
      return date.getDay() === 0 ? 'Sunday' : 'Saturday';
    }
      const holiday = holidays.find(h => {
        const holidayDate = new Date(h.date);
        return isSameDay(holidayDate, date);
      });
    return holiday ? holiday.name : null;
  };

  // Custom day class name for highlighting holidays
  const dayClassName = (date: Date) => {
    const classes: string[] = [];
    
    const isWeekendDay = isWeekend(date);
    const isCustomHoliday = !isWeekendDay && holidays.some(h => {
      const holidayDate = new Date(h.date);
      return isSameDay(holidayDate, date);
    });
    
    // Add weekend class for Saturday and Sunday
    if (isWeekendDay) {
      classes.push('react-datepicker__day--weekend');
    }
    
    // Add holiday class for custom holidays (not weekends)
    if (isCustomHoliday) {
      classes.push('holiday-day');
    }

    // Add range selection classes (only for selectable dates)
    if (startDate && endDate && !isWeekendDay && !isCustomHoliday) {
      const dateStart = startOfDay(date);
      const rangeStart = startOfDay(startDate);
      const rangeEnd = endOfDay(endDate);
      
      // Manual check if date is within interval
      if (dateStart >= rangeStart && dateStart <= rangeEnd) {
        classes.push('react-datepicker__day--in-range');
      }
      
      if (isSameDay(date, startDate)) {
        classes.push('react-datepicker__day--range-start');
      }
      
      if (isSameDay(date, endDate)) {
        classes.push('react-datepicker__day--range-end');
      }
    } else if (startDate && isSameDay(date, startDate) && !isWeekendDay && !isCustomHoliday) {
      classes.push('react-datepicker__day--range-start');
    }
    
    return classes.join(' ');
  };

  const handleChange = (dates: Date | [Date | null, Date | null] | null) => {
    if (selectsRange) {
      if (Array.isArray(dates)) {
        onChange(dates[0], dates[1]);
      } else if (dates instanceof Date) {
        // Single date selected when range is enabled, treat as start date
        onChange(dates, null);
      } else {
        onChange(null, null);
      }
    } else {
      // Single date selection
      if (dates instanceof Date) {
        onChange(dates, null);
      } else {
        onChange(null, null);
      }
    }
  };

  const datePickerProps: any = {
    selected: startDate,
    onChange: handleChange,
    startDate: startDate,
    endDate: endDate,
    selectsRange: selectsRange,
    minDate: minDate,
    maxDate: maxDate,
    disabled: disabled,
    inline: inline,
    calendarClassName: "holiday-calendar",
    dayClassName: dayClassName,
    highlightDates: holidays.map(h => new Date(h.date)),
    filterDate: (date: Date) => {
      // Disable weekends (Saturday and Sunday)
      if (isWeekend(date)) {
        return false;
      }
      // Disable custom holidays
      const isCustomHoliday = holidays.some(h => {
        const holidayDate = new Date(h.date);
        return isSameDay(holidayDate, date);
      });
      if (isCustomHoliday) {
        return false;
      }
      // Allow all other dates
      return true;
    },
    calendarStartDay: 1,
    monthsShown: monthsShown,
    showMonthDropdown: true,
    showYearDropdown: true,
    dropdownMode: "select",
    dateFormat: inline ? undefined : "yyyy-MM-dd",
    shouldCloseOnSelect: !selectsRange,
    renderDayContents: (dayOfMonth: number, date: Date) => {
      const holidayName = getHolidayName(date);
      const isWeekendDay = isWeekend(date);
      return (
        <div className="date-picker-day">
          <span>{dayOfMonth}</span>
          {holidayName && !isWeekendDay && (
            <span className="holiday-indicator" title={holidayName}>
              ●
            </span>
          )}
        </div>
      );
    }
  };

  return (
    <div className="w-full">
      {selectsRange && !disabled && <RangeHint startDate={startDate} endDate={endDate} />}
      <DatePicker {...datePickerProps} />
      {showHolidays && (
        <div className="mt-3 rounded-lg bg-blue-50 p-3">
          <p className="text-xs font-semibold text-blue-800 mb-2">Holiday Indicators:</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-blue-700 mb-2">
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 rounded bg-red-200 border border-red-300"></span>
              <span>Weekend (Saturday/Sunday) - Disabled</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 rounded bg-amber-200 border border-amber-300"></span>
              <span>Custom Holiday - Disabled</span>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Weekends and holidays are automatically excluded from leave calculations and cannot be selected.
          </p>
        </div>
      )}
      {startDate && endDate && (
        <div className="mt-2 text-sm text-[#101828]">
          Selected Range: <span className="font-semibold">
            {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
          </span>
        </div>
      )}
    </div>
  );
}
