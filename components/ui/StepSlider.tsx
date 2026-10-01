'use client';

import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

export interface StepSliderOption<T extends string> {
  value: T;
  label: string;
  /** CSS colour for the filled track and thumb ring while this step is selected. */
  color: string;
  /** Classes for the label shown beside the slider. */
  labelClass?: string;
}

interface StepSliderProps<T extends string> {
  /** Steps in track order, left to right. Needs at least two. */
  options: StepSliderOption<T>[];
  value: T;
  /**
   * Called once when a different step is chosen - on pointer release or a key
   * press, not on every step passed while dragging. While it is pending the
   * slider stays on the chosen step and ignores further input, then returns to
   * `value`, so the caller should handle its own errors.
   */
  onChange: (value: T) => void | Promise<void>;
  ariaLabel: string;
  disabled?: boolean;
}

const THUMB_PX = 16;

// A discrete "pick one of N levels" control: dots on a track with a draggable
// thumb and the selected step's label beside it. Steps are click targets,
// the thumb drags, and Arrow/Home/End keys move it - role="slider" on the
// track carries the semantics.
export function StepSlider<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  disabled = false,
}: StepSliderProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  const last = options.length - 1;
  const currentIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const shownIndex = dragIndex ?? pendingIndex ?? currentIndex;
  const shown = options[shownIndex];
  const locked = disabled || pendingIndex !== null;

  // Step positions follow the thumb's travel (its centre runs from THUMB/2 to
  // width - THUMB/2), so dots, fill and thumb stay aligned at both ends.
  const stepLeft = (index: number) =>
    `calc(${THUMB_PX / 2}px + (100% - ${THUMB_PX}px) * ${last > 0 ? index / last : 0})`;

  const indexFromPointer = (clientX: number): number | null => {
    const rect = trackRef.current?.getBoundingClientRect();
    const travel = rect ? rect.width - THUMB_PX : 0;
    if (!rect || travel <= 0) return null;
    const ratio = (clientX - rect.left - THUMB_PX / 2) / travel;
    return Math.round(Math.min(1, Math.max(0, ratio)) * last);
  };

  const commit = async (index: number) => {
    if (locked || index === currentIndex) return;
    setPendingIndex(index);
    try {
      await onChange(options[index].value);
    } finally {
      setPendingIndex(null);
    }
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (locked) return;
    const index = indexFromPointer(e.clientX);
    if (index === null) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDragIndex(index);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragIndex === null) return;
    const index = indexFromPointer(e.clientX);
    if (index !== null && index !== dragIndex) setDragIndex(index);
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (dragIndex === null) return;
    const index = indexFromPointer(e.clientX) ?? dragIndex;
    setDragIndex(null);
    void commit(index);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (locked) return;
    let next: number;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(last, shownIndex + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(0, shownIndex - 1);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    else return;
    e.preventDefault();
    void commit(next);
  };

  return (
    <div className="inline-flex items-center gap-3">
      <div
        ref={trackRef}
        role="slider"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={shownIndex}
        aria-valuetext={shown.label}
        aria-disabled={locked}
        tabIndex={locked ? -1 : 0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setDragIndex(null)}
        onKeyDown={handleKeyDown}
        className={`relative h-5 w-16 shrink-0 touch-none select-none rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
          locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        }`}
      >
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[var(--gray-100)]" />
        <div
          className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full transition-[width] duration-150 motion-reduce:transition-none"
          style={{ width: stepLeft(shownIndex), backgroundColor: shown.color }}
        />
        {options.map((option, index) => (
          <span
            key={option.value}
            data-testid="step-slider-dot"
            className={`absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              index <= shownIndex ? 'bg-white/80' : 'bg-[var(--gray-300)]'
            }`}
            style={{ left: stepLeft(index) }}
          />
        ))}
        <span
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white shadow transition-[left] duration-150 motion-reduce:transition-none"
          style={{ left: stepLeft(shownIndex), borderColor: shown.color }}
        />
      </div>
      <span className={`min-w-[3.75rem] text-xs font-semibold ${shown.labelClass ?? ''}`}>{shown.label}</span>
    </div>
  );
}
